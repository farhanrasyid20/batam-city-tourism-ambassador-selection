<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParticipantDocument;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ParticipantDocumentController extends Controller
{
    private const DOCUMENT_DEFINITIONS = [
        'identityCard' => ['label' => 'KTP / SIM / Paspor / Kartu Pelajar', 'required' => true, 'max_kb' => 5120],
        'closeUpPhoto' => ['label' => 'Foto Close Up 4R', 'required' => true, 'max_kb' => 3072],
        'fullBodyPhoto' => ['label' => 'Foto Full Body 4R', 'required' => true, 'max_kb' => 3072],
        'formS01' => ['label' => 'Formulir S-01', 'required' => true, 'max_kb' => 5120],
        'formS02' => ['label' => 'Formulir S-02', 'required' => true, 'max_kb' => 5120],
        'formS03' => ['label' => 'Formulir S-03', 'required' => true, 'max_kb' => 5120],
        'formS04' => ['label' => 'Formulir S-04', 'required' => true, 'max_kb' => 5120],
        'certificate' => ['label' => 'Sertifikat / Piagam Prestasi', 'required' => false, 'max_kb' => 5120],
    ];

    private function currentParticipant(Request $request): ?User
    {
        /** @var User|null $user */
        $user = $request->attributes->get('auth_user');
        if (! $user || $user->role !== 'participant') {
            return null;
        }

        return $user;
    }

    private function ensureProfile(User $user): ParticipantProfile
    {
        return $user->participantProfile()->firstOrCreate([
            'user_id' => $user->id,
        ]);
    }

    private function participantPayload(User $user): array
    {
        $profile = $this->ensureProfile($user);
        $documents = $user->participantDocuments()->orderBy('id')->get()->map(fn ($doc) => [
            'key' => $doc->document_key,
            'label' => $doc->label,
            'required' => (bool) $doc->is_required,
            'status' => $doc->status,
            'original_name' => $doc->original_name,
            'size_bytes' => $doc->size_bytes,
            'mime_type' => $doc->mime_type,
            'path' => $doc->path,
            'url' => $doc->url,
            'uploaded_at' => $doc->uploaded_at?->toISOString(),
            'note' => $doc->note,
        ])->values()->all();

        return [
            'id' => $user->id,
            'participant_number' => $profile->participant_number ?: $profile->audition_number,
            'audition_number' => $profile->audition_number ?: $profile->participant_number,
            'participant_code' => $profile->participant_code,
            'submitted_to_admin' => (bool) $profile->submitted_to_admin,
            'submitted_to_admin_at' => $profile->submitted_to_admin_at?->toISOString(),
            'eliminated_in_audition' => (bool) $profile->eliminated_in_audition,
            'eliminated_at' => $profile->eliminated_at?->toISOString(),
            'documents' => $documents,
        ];
    }

    private function nextAuditionNumber(): string
    {
        $numbers = ParticipantProfile::query()
            ->where(function ($query): void {
                $query->whereNotNull('audition_number')
                    ->orWhereNotNull('participant_number');
            })
            ->lockForUpdate()
            ->get(['audition_number', 'participant_number']);

        $max = 0;
        foreach ($numbers as $number) {
            foreach ([(string) ($number->audition_number ?? ''), (string) ($number->participant_number ?? '')] as $raw) {
                if (preg_match('/^(?:AUD|P)-(\d+)$/', $raw, $matches)) {
                    $current = (int) $matches[1];
                    if ($current > $max) {
                        $max = $current;
                    }
                }
            }
        }

        return 'AUD-'.str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
    }

    private function assertNotEliminated(ParticipantProfile $profile): void
    {
        if ($profile->eliminated_in_audition) {
            throw ValidationException::withMessages([
                'selection_status' => ['Anda sudah tereliminasi pada tahap audisi dan tidak dapat melanjutkan proses berikutnya.'],
            ]);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $user = $this->currentParticipant($request);
        if (! $user) {
            return response()->json(['message' => 'Akses hanya untuk peserta.'], 403);
        }

        return response()->json([
            'message' => 'Data dokumen peserta berhasil diambil.',
            'data' => $this->participantPayload($user->fresh()),
        ]);
    }

    public function upload(Request $request): JsonResponse
    {
        $user = $this->currentParticipant($request);
        if (! $user) {
            return response()->json(['message' => 'Akses hanya untuk peserta.'], 403);
        }

        $validated = $request->validate([
            'document_key' => ['required', 'string'],
            'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf,webp'],
        ]);

        $documentKey = $validated['document_key'];
        if (! array_key_exists($documentKey, self::DOCUMENT_DEFINITIONS)) {
            throw ValidationException::withMessages([
                'document_key' => ['Jenis dokumen tidak valid.'],
            ]);
        }

        $file = $request->file('file');
        if (! $file) {
            throw ValidationException::withMessages([
                'file' => ['File dokumen tidak ditemukan.'],
            ]);
        }

        $definition = self::DOCUMENT_DEFINITIONS[$documentKey];
        $maxBytes = ((int) $definition['max_kb']) * 1024;
        if ($file->getSize() > $maxBytes) {
            throw ValidationException::withMessages([
                'file' => ['Ukuran file melebihi batas untuk dokumen ini.'],
            ]);
        }

        /** @var ParticipantDocument|null $existing */
        $existing = $user->participantDocuments()
            ->where('document_key', $documentKey)
            ->first();
        if ($existing && is_string($existing->path) && $existing->path !== '') {
            Storage::disk('public')->delete($existing->path);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $path = 'participant-documents/'.$user->id.'/'.$documentKey.'-'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));

        ParticipantDocument::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'document_key' => $documentKey,
            ],
            [
                'label' => $definition['label'],
                'is_required' => (bool) $definition['required'],
                'status' => 'submitted',
                'original_name' => $file->getClientOriginalName(),
                'size_bytes' => (int) $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'path' => $path,
                'url' => '/storage/'.$path,
                'uploaded_at' => now(),
                'note' => null,
            ]
        );

        $profile = $this->ensureProfile($user);
        $this->assertNotEliminated($profile);
        $profile->submitted_to_admin = false;
        $profile->submitted_to_admin_at = null;
        $profile->save();

        return response()->json([
            'message' => 'Dokumen berhasil diupload.',
            'data' => $this->participantPayload($user->fresh()),
        ]);
    }

    public function submit(Request $request): JsonResponse
    {
        $user = $this->currentParticipant($request);
        if (! $user) {
            return response()->json(['message' => 'Akses hanya untuk peserta.'], 403);
        }

        $profile = $this->ensureProfile($user);
        $this->assertNotEliminated($profile);

        $documents = $user->participantDocuments()
            ->whereIn('document_key', array_keys(self::DOCUMENT_DEFINITIONS))
            ->get()
            ->keyBy('document_key');
        $missingRequired = [];
        foreach (self::DOCUMENT_DEFINITIONS as $key => $definition) {
            if (! $definition['required']) {
                continue;
            }

            /** @var ParticipantDocument|null $doc */
            $doc = $documents->get($key);
            if (! $doc || ! is_string($doc->path) || $doc->path === '') {
                $missingRequired[] = $definition['label'];
            }
        }

        if (! empty($missingRequired)) {
            return response()->json([
                'message' => 'Berkas wajib belum lengkap.',
                'errors' => [
                    'documents' => ['Mohon lengkapi semua berkas wajib sebelum submit.'],
                    'missing_required_labels' => $missingRequired,
                ],
            ], 422);
        }

        DB::transaction(function () use ($user): void {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            /** @var ParticipantProfile $profile */
            $profile = ParticipantProfile::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $profile) {
                $profile = new ParticipantProfile(['user_id' => $user->id]);
            }

            if (! $profile->audition_number && ! $profile->participant_number) {
                $auditionNumber = $this->nextAuditionNumber();
                $profile->audition_number = $auditionNumber;
                // Pertahankan field lama agar kompatibel dengan UI lama.
                $profile->participant_number = $auditionNumber;
            } elseif (! $profile->audition_number && $profile->participant_number) {
                $profile->audition_number = $profile->participant_number;
            } elseif ($profile->audition_number && ! $profile->participant_number) {
                $profile->participant_number = $profile->audition_number;
            }

            $profile->submitted_to_admin = true;
            $profile->submitted_to_admin_at = now();
            $profile->save();
        });

        $fresh = $user->fresh();

        return response()->json([
            'message' => 'Berkas berhasil dikirim ke admin untuk verifikasi.',
            'data' => $this->participantPayload($fresh),
        ]);
    }
}
