<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParticipantDocument;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    private const PARTICIPANT_REQUIRED_DOCUMENTS = [
        'identityCard' => ['label' => 'KTP / SIM / Paspor / Kartu Pelajar', 'required' => true],
        'closeUpPhoto' => ['label' => 'Foto Close Up 4R', 'required' => true],
        'fullBodyPhoto' => ['label' => 'Foto Full Body 4R', 'required' => true],
        'formS01' => ['label' => 'Formulir S-01', 'required' => true],
        'formS02' => ['label' => 'Formulir S-02', 'required' => true],
        'formS03' => ['label' => 'Formulir S-03', 'required' => true],
        'formS04' => ['label' => 'Formulir S-04', 'required' => true],
        'certificate' => ['label' => 'Sertifikat / Piagam Prestasi', 'required' => false],
    ];

    private const ALLOWED_JUDGE_STAGES = ['Audition', 'Pre Camp', 'Camp', 'Grand Final'];
    private const ALLOWED_JUDGE_TYPES = ['judge', 'committee', 'mentor', 'camp_team'];
    private const DEFAULT_JUDGE_TYPE = 'judge';

    private const DEFAULT_JUDGE_STAGES = ['Audition', 'Pre Camp', 'Camp', 'Grand Final'];

    private const PARTICIPANT_SELECTION_STATUSES = [
        'Pending',
        'Verified',
        'TechnicalMeeting',
        'Rejected',
        'Audition',
        'Top20',
        'PreCamp',
        'Camp',
        'GrandFinal',
        'Winner',
    ];

    private const PARTICIPANT_CODE_ELIGIBLE_STATUSES = [
        'Top20',
        'PreCamp',
        'Camp',
        'GrandFinal',
        'Winner',
    ];

    private function allowedRolesFor(?string $requesterRole): array
    {
        return $requesterRole === 'admin' ? ['judge'] : ['admin', 'judge'];
    }

    private function isParticipantCodeEligibleStatus(string $status): bool
    {
        return in_array($status, self::PARTICIPANT_CODE_ELIGIBLE_STATUSES, true);
    }

    /**
     * @param  array<int, mixed>|null  $stages
     * @return array<int, string>
     */
    private function normalizeJudgeStages(?array $stages): array
    {
        if (! is_array($stages)) {
            return self::DEFAULT_JUDGE_STAGES;
        }

        $filtered = [];
        foreach ($stages as $stage) {
            if (! is_string($stage)) {
                continue;
            }
            if (in_array($stage, self::ALLOWED_JUDGE_STAGES, true)) {
                $filtered[] = $stage;
            }
        }

        $unique = array_values(array_unique($filtered));
        return empty($unique) ? self::DEFAULT_JUDGE_STAGES : $unique;
    }

    private function nextParticipantCodeForGender(string $gender): string
    {
        $normalizedGender = strtolower($gender) === 'puan' ? 'Puan' : 'Encik';
        $prefix = $normalizedGender === 'Puan' ? 'PUA' : 'ECK';

        $codes = ParticipantProfile::query()
            ->where('gender', $normalizedGender)
            ->whereNotNull('participant_code')
            ->lockForUpdate()
            ->pluck('participant_code');

        $maxOdd = 0;
        foreach ($codes as $code) {
            if (preg_match('/^'.$prefix.'-(\d+)$/', (string) $code, $matches)) {
                $current = (int) $matches[1];
                if ($current % 2 === 1 && $current > $maxOdd) {
                    $maxOdd = $current;
                }
            }
        }

        $next = $maxOdd > 0 ? ($maxOdd + 2) : 1;
        return $prefix.'-'.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }

    public function index(Request $request): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);
        $role = $request->query('role');
        $search = trim((string) $request->query('search', ''));

        $query = User::query()
            ->whereIn('role', $allowedRoles)
            ->orderByDesc('id');

        if (in_array($role, $allowedRoles, true)) {
            $query->where('role', $role);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $items = $query->get(['id', 'name', 'email', 'phone', 'role', 'account_status', 'judge_assigned_stages', 'judge_type', 'judge_title', 'judge_organization', 'judge_avatar', 'email_verified_at', 'created_at', 'updated_at']);

        return response()->json([
            'message' => 'Daftar user internal berhasil diambil.',
            'data' => $items,
            'total' => $items->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in($allowedRoles)],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'account_status' => ['nullable', Rule::in(['active', 'suspended'])],
            'judge_assigned_stages' => ['nullable', 'array'],
            'judge_assigned_stages.*' => [Rule::in(self::ALLOWED_JUDGE_STAGES)],
            'judge_type' => ['nullable', Rule::in(self::ALLOWED_JUDGE_TYPES)],
            'judge_title' => ['nullable', 'string', 'max:255'],
            'judge_organization' => ['nullable', 'string', 'max:255'],
            'judge_avatar' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->string('name')->toString(),
            'email' => strtolower($request->string('email')->toString()),
            'phone' => $request->string('phone')->toString() ?: null,
            'role' => $request->string('role')->toString(),
            'password' => $request->string('password')->toString(),
            'account_status' => $request->string('account_status')->toString() ?: 'active',
            'judge_assigned_stages' => $request->string('role')->toString() === 'judge'
                ? $this->normalizeJudgeStages($request->input('judge_assigned_stages'))
                : null,
            'judge_type' => $request->string('role')->toString() === 'judge'
                ? (in_array($request->string('judge_type')->toString(), self::ALLOWED_JUDGE_TYPES, true)
                    ? $request->string('judge_type')->toString()
                    : self::DEFAULT_JUDGE_TYPE)
                : null,
            'judge_title' => $request->string('role')->toString() === 'judge'
                ? ($request->string('judge_title')->toString() ?: null)
                : null,
            'judge_organization' => $request->string('role')->toString() === 'judge'
                ? ($request->string('judge_organization')->toString() ?: null)
                : null,
            'judge_avatar' => $request->string('role')->toString() === 'judge'
                ? ($request->string('judge_avatar')->toString() ?: null)
                : null,
        ]);
        $user->forceFill([
            'email_verified_at' => Carbon::now(),
        ])->save();

        return response()->json([
            'message' => 'User internal berhasil dibuat.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'account_status', 'judge_assigned_stages', 'judge_type', 'judge_title', 'judge_organization', 'judge_avatar', 'email_verified_at']),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $user */
        $user = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'role' => ['sometimes', 'required', Rule::in($allowedRoles)],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
            'account_status' => ['sometimes', 'required', Rule::in(['active', 'suspended'])],
            'judge_assigned_stages' => ['sometimes', 'nullable', 'array'],
            'judge_assigned_stages.*' => [Rule::in(self::ALLOWED_JUDGE_STAGES)],
            'judge_type' => ['sometimes', 'nullable', Rule::in(self::ALLOWED_JUDGE_TYPES)],
            'judge_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'judge_organization' => ['sometimes', 'nullable', 'string', 'max:255'],
            'judge_avatar' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        if (array_key_exists('name', $payload)) {
            $user->name = $payload['name'];
        }
        if (array_key_exists('email', $payload)) {
            $user->email = strtolower($payload['email']);
        }
        if (array_key_exists('phone', $payload)) {
            $user->phone = $payload['phone'] ?: null;
        }
        if (array_key_exists('role', $payload)) {
            $user->role = $payload['role'];
            if ($user->role !== 'judge') {
                $user->judge_assigned_stages = null;
                $user->judge_type = null;
                $user->judge_title = null;
                $user->judge_organization = null;
                $user->judge_avatar = null;
            } elseif (empty($user->judge_assigned_stages)) {
                $user->judge_assigned_stages = self::DEFAULT_JUDGE_STAGES;
                $user->judge_type = self::DEFAULT_JUDGE_TYPE;
            }
        }
        if (array_key_exists('account_status', $payload)) {
            $user->account_status = $payload['account_status'];
        }
        if (array_key_exists('judge_assigned_stages', $payload) && $user->role === 'judge') {
            $user->judge_assigned_stages = $this->normalizeJudgeStages($payload['judge_assigned_stages']);
        }
        if (array_key_exists('judge_type', $payload) && $user->role === 'judge') {
            $user->judge_type = $payload['judge_type'] ?: self::DEFAULT_JUDGE_TYPE;
        }
        if (array_key_exists('judge_title', $payload) && $user->role === 'judge') {
            $user->judge_title = $payload['judge_title'] ?: null;
        }
        if (array_key_exists('judge_organization', $payload) && $user->role === 'judge') {
            $user->judge_organization = $payload['judge_organization'] ?: null;
        }
        if (array_key_exists('judge_avatar', $payload) && $user->role === 'judge') {
            $user->judge_avatar = $payload['judge_avatar'] ?: null;
        }
        if (array_key_exists('password', $payload)) {
            $user->password = $payload['password'];
        }

        $user->save();

        return response()->json([
            'message' => 'User internal berhasil diperbarui.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'account_status', 'judge_assigned_stages', 'judge_type', 'judge_title', 'judge_organization', 'judge_avatar', 'email_verified_at']),
        ]);
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $requesterRole = $request->attributes->get('auth_user')->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $user */
        $user = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->account_status = 'suspended';
        $user->save();

        return response()->json([
            'message' => 'User berhasil dinonaktifkan.',
        ]);
    }

    public function activate(Request $request, int $id): JsonResponse
    {
        $requesterRole = $request->attributes->get('auth_user')->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $user */
        $user = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->account_status = 'active';
        if (! $user->email_verified_at) {
            $user->email_verified_at = Carbon::now();
        }
        $user->save();

        return response()->json([
            'message' => 'User berhasil diaktifkan.',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $target */
        $target = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $target) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $authUser = $request->attributes->get('auth_user');
        if ($authUser && (int) $authUser->id === (int) $target->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $target->delete();

        return response()->json([
            'message' => 'User internal berhasil dihapus.',
        ]);
    }

    public function updateParticipantSelectionStatus(Request $request, int $id): JsonResponse
    {
        /** @var User|null $participant */
        $participant = User::query()
            ->where('role', 'participant')
            ->find($id);

        if (! $participant) {
            return response()->json([
                'message' => 'Peserta tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'selection_status' => ['required', Rule::in(self::PARTICIPANT_SELECTION_STATUSES)],
            'selection_status_note' => ['nullable', 'string', 'max:3000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        /** @var ParticipantProfile $profile */
        $profile = $participant->participantProfile()->firstOrCreate([
            'user_id' => $participant->id,
        ]);

        $profile->selection_status = $payload['selection_status'];
        $profile->selection_status_note = $payload['selection_status_note'] ?? null;
        $profile->selection_status_updated_at = Carbon::now();

        if ($payload['selection_status'] === 'Rejected') {
            // Rejected pada fase ini dianggap eliminasi audisi (tidak lanjut tahap berikutnya).
            $profile->eliminated_in_audition = true;
            $profile->eliminated_at = Carbon::now();
        } elseif ($this->isParticipantCodeEligibleStatus($payload['selection_status'])) {
            $profile->eliminated_in_audition = false;
            $profile->eliminated_at = null;

            if (! $profile->participant_code && ! empty($profile->gender)) {
                $profile->participant_code = $this->nextParticipantCodeForGender($profile->gender);
            }
        }

        $profile->save();

        return response()->json([
            'message' => 'Status seleksi peserta berhasil diperbarui.',
            'data' => [
                'user_id' => $participant->id,
                'selection_status' => $profile->selection_status,
                'selection_status_note' => $profile->selection_status_note,
                'selection_status_updated_at' => $profile->selection_status_updated_at?->toISOString(),
                'participant_code' => $profile->participant_code,
                'eliminated_in_audition' => (bool) $profile->eliminated_in_audition,
                'eliminated_at' => $profile->eliminated_at?->toISOString(),
            ],
        ]);
    }

    public function updateParticipantDocumentReviews(Request $request, int $id): JsonResponse
    {
        /** @var User|null $participant */
        $participant = User::query()
            ->where('role', 'participant')
            ->find($id);

        if (! $participant) {
            return response()->json([
                'message' => 'Peserta tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'documents' => ['required', 'array', 'min:1'],
            'documents.*.key' => ['required', 'string', Rule::in(array_keys(self::PARTICIPANT_REQUIRED_DOCUMENTS))],
            'documents.*.status' => ['required', Rule::in(['submitted', 'revision_required', 'verified', 'missing'])],
            'documents.*.note' => ['nullable', 'string', 'max:3000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        foreach ($payload['documents'] as $docPayload) {
            $key = (string) $docPayload['key'];
            $meta = self::PARTICIPANT_REQUIRED_DOCUMENTS[$key] ?? null;
            if (! $meta) {
                continue;
            }

            /** @var ParticipantDocument|null $existing */
            $existing = ParticipantDocument::query()
                ->where('user_id', $participant->id)
                ->where('document_key', $key)
                ->first();

            if (! $existing) {
                ParticipantDocument::query()->create([
                    'user_id' => $participant->id,
                    'document_key' => $key,
                    'label' => $meta['label'],
                    'is_required' => (bool) $meta['required'],
                    'status' => $docPayload['status'],
                    'note' => $docPayload['note'] ?? null,
                ]);
                continue;
            }

            $existing->status = $docPayload['status'];
            $existing->note = $docPayload['note'] ?? null;
            if (! $existing->label) {
                $existing->label = $meta['label'];
            }
            $existing->is_required = (bool) $meta['required'];
            $existing->save();
        }

        $updatedDocuments = ParticipantDocument::query()
            ->where('user_id', $participant->id)
            ->orderBy('document_key')
            ->get()
            ->map(function (ParticipantDocument $doc): array {
                $rawUrl = is_string($doc->url) ? trim($doc->url) : null;
                $rawPath = is_string($doc->path) ? trim($doc->path) : null;

                $resolvedUrl = null;
                if ($rawUrl !== null && $rawUrl !== '') {
                    $resolvedUrl = str_starts_with($rawUrl, 'http://') || str_starts_with($rawUrl, 'https://')
                        ? $rawUrl
                        : asset(ltrim($rawUrl, '/'));
                } elseif ($rawPath !== null && $rawPath !== '') {
                    $resolvedUrl = asset('storage/'.ltrim($rawPath, '/'));
                }

                return [
                    'key' => $doc->document_key,
                    'label' => $doc->label,
                    'required' => (bool) $doc->is_required,
                    'status' => $doc->status ?: 'missing',
                    'original_name' => $doc->original_name,
                    'size_bytes' => $doc->size_bytes,
                    'mime_type' => $doc->mime_type,
                    'path' => $doc->path,
                    'url' => $resolvedUrl,
                    'uploaded_at' => $doc->uploaded_at?->toIso8601String(),
                    'note' => $doc->note,
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Status dokumen verifikasi berhasil disimpan.',
            'data' => [
                'user_id' => $participant->id,
                'documents' => $updatedDocuments,
            ],
        ]);
    }
}
