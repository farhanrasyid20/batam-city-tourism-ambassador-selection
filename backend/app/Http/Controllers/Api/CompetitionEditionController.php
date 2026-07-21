<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEdition;
use App\Models\ParticipantProfile;
use App\Models\ParticipantRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CompetitionEditionController extends Controller
{
    private const STATUSES = ['draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'archived'];

    private function payload(CompetitionEdition $edition, bool $withCounts = false): array
    {
        $data = [
            'id' => $edition->id,
            'year' => $edition->year,
            'name' => $edition->name,
            'status' => $edition->status,
            'is_active' => (bool) $edition->is_active,
            'registration_is_open' => $edition->registrationIsOpen(),
            'registration_start_at' => $edition->registration_start_at?->toISOString(),
            'registration_end_at' => $edition->registration_end_at?->toISOString(),
            'registration_reopened_at' => $edition->registration_reopened_at?->toISOString(),
            'registration_reopen_reason' => $edition->registration_reopen_reason,
        ];

        if ($withCounts) {
            $counts = ParticipantRegistration::query()
                ->where('edition_id', $edition->id)
                ->selectRaw('COUNT(*) as total')
                ->selectRaw("SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted")
                ->selectRaw("SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft")
                ->selectRaw("SUM(CASE WHEN gender = 'Encik' THEN 1 ELSE 0 END) as encik")
                ->selectRaw("SUM(CASE WHEN gender = 'Puan' THEN 1 ELSE 0 END) as puan")
                ->first();
            $data['counts'] = [
                'total' => (int) ($counts?->total ?? 0),
                'submitted' => (int) ($counts?->submitted ?? 0),
                'draft' => (int) ($counts?->draft ?? 0),
                'encik' => (int) ($counts?->encik ?? 0),
                'puan' => (int) ($counts?->puan ?? 0),
            ];
        }

        return $data;
    }

    public function current(): JsonResponse
    {
        $edition = CompetitionEdition::active();
        return response()->json(['data' => $edition ? $this->payload($edition) : null]);
    }

    public function index(): JsonResponse
    {
        $editions = CompetitionEdition::query()->orderByDesc('year')->get();
        return response()->json(['data' => $editions->map(fn ($edition) => $this->payload($edition, true))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'year' => ['required', 'integer', 'min:2020', 'max:2100', 'unique:competition_editions,year'],
            'name' => ['nullable', 'string', 'max:150'],
            'registration_start_at' => ['nullable', 'date'],
            'registration_end_at' => ['nullable', 'date', 'after:registration_start_at'],
        ]);
        if ($validator->fails()) return response()->json(['message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        $data = $validator->validated();
        $year = (int) $data['year'];
        $edition = CompetitionEdition::query()->create([
            'year' => $year,
            'name' => $data['name'] ?? "Pemilihan Duta Wisata Kota Batam {$year}",
            'status' => 'draft',
            'registration_start_at' => $data['registration_start_at'] ?? null,
            'registration_end_at' => $data['registration_end_at'] ?? null,
        ]);
        return response()->json(['message' => 'Edisi berhasil dibuat.', 'data' => $this->payload($edition, true)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $edition = CompetitionEdition::query()->findOrFail($id);
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'status' => ['sometimes', 'required', Rule::in(self::STATUSES)],
            'registration_start_at' => ['sometimes', 'nullable', 'date'],
            'registration_end_at' => ['sometimes', 'nullable', 'date'],
            'registration_reopen_reason' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        if ($validator->fails()) return response()->json(['message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        $data = $validator->validated();
        if (($data['status'] ?? null) === 'registration_open' && $edition->status !== 'registration_open') {
            $edition->registration_reopened_at = now();
        }
        DB::transaction(function () use ($edition, $data): void {
            if (($data['is_active'] ?? false) === true) CompetitionEdition::query()->whereKeyNot($edition->id)->update(['is_active' => false]);
            $edition->fill($data)->save();
        });
        return response()->json(['message' => 'Pengaturan edisi berhasil disimpan.', 'data' => $this->payload($edition->fresh(), true)]);
    }

    public function registrations(Request $request, int $id): JsonResponse
    {
        $edition = CompetitionEdition::query()->findOrFail($id);
        $items = ParticipantRegistration::query()->with('user:id,name,email,phone')->where('edition_id', $edition->id)->orderByDesc('submitted_at')->orderByDesc('id')->get();
        return response()->json(['edition' => $this->payload($edition, true), 'data' => $items->map(fn ($r) => [
            'id' => $r->id, 'user_id' => $r->user_id, 'name' => $r->user?->name, 'email' => $r->user?->email,
            'gender' => $r->gender, 'status' => $r->status, 'selection_status' => $r->selection_status,
            'audition_number' => $r->audition_number, 'participant_code' => $r->participant_code,
            'submitted_at' => $r->submitted_at?->toISOString(),
        ])->values()]);
    }

    public function participantCurrent(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $edition = CompetitionEdition::active();
        $registration = $edition ? ParticipantRegistration::query()->where('edition_id', $edition->id)->where('user_id', $user->id)->first() : null;
        return response()->json(['edition' => $edition ? $this->payload($edition) : null, 'registration' => $registration]);
    }

    public function startRegistration(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $edition = CompetitionEdition::active();
        if (! $edition || ! $edition->registrationIsOpen()) return response()->json(['message' => 'Pendaftaran belum dibuka atau sudah ditutup.'], 422);
        $profile = ParticipantProfile::query()->where('user_id', $user->id)->first();
        $registration = ParticipantRegistration::query()->firstOrCreate(
            ['edition_id' => $edition->id, 'user_id' => $user->id],
            ['status' => 'draft', 'gender' => $profile?->gender]
        );
        return response()->json(['message' => 'Draft pendaftaran berhasil dibuat. Silakan periksa biodata dan dokumen Anda.', 'edition' => $this->payload($edition), 'registration' => $registration], 201);
    }
}
