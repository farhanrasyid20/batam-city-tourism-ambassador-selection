<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParticipantProfile;
use App\Models\User;
use App\Models\CompetitionEdition;
use App\Models\ParticipantRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class ParticipantBiodataController extends Controller
{
    private function resolveProfilePhoto(?ParticipantProfile $profile, User $user): ?string
    {
        $photo = is_string($profile?->photo) ? trim($profile->photo) : '';
        if ($photo !== '' && str_contains($photo, '/participant-documents/')) {
            // Jangan pernah gunakan foto dari berkas dokumen sebagai foto profil.
            return null;
        }
        return $photo !== '' ? $photo : null;
    }

    private function ensureProfile(User $user): ParticipantProfile
    {
        return $user->participantProfile()->firstOrCreate([
            'user_id' => $user->id,
        ]);
    }

    private function normalizePhoto(?string $photo, ?string $existingPhoto = null): ?string
    {
        if ($photo === null) {
            return null;
        }

        $photo = trim($photo);
        if ($photo === '') {
            return null;
        }

        if (str_contains($photo, '/participant-documents/')) {
            throw ValidationException::withMessages([
                'photo' => ['Foto profil tidak boleh menggunakan file dokumen pendaftaran.'],
            ]);
        }

        if (! str_starts_with($photo, 'data:image/')) {
            return $photo;
        }

        if (! preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/', $photo, $matches)) {
            throw ValidationException::withMessages([
                'photo' => ['Format foto profil tidak valid.'],
            ]);
        }

        $rawExt = strtolower($matches[1]);
        $extension = match ($rawExt) {
            'jpeg' => 'jpg',
            'jpg', 'png', 'webp' => $rawExt,
            default => null,
        };

        if (! $extension) {
            throw ValidationException::withMessages([
                'photo' => ['Format foto profil harus JPG, PNG, atau WEBP.'],
            ]);
        }

        $binary = base64_decode($matches[2], true);
        if ($binary === false) {
            throw ValidationException::withMessages([
                'photo' => ['Data foto profil tidak dapat diproses.'],
            ]);
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'photo' => ['Ukuran foto profil maksimal 5 MB.'],
            ]);
        }

        $path = 'participant-photos/'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, $binary);

        if ($existingPhoto && str_starts_with($existingPhoto, '/storage/participant-photos/')) {
            $oldPath = Str::after($existingPhoto, '/storage/');
            Storage::disk('public')->delete($oldPath);
        }

        return '/storage/'.$path;
    }

    private function biodataPayload(User $user): array
    {
        $profile = $this->ensureProfile($user);
        $edition = CompetitionEdition::active();
        $registration = $edition ? ParticipantRegistration::query()->where('edition_id', $edition->id)->where('user_id', $user->id)->first() : null;
        $documents = $user->participantDocuments()
            ->when($edition, fn ($query) => $query->where('edition_id', $edition->id))
            ->orderBy('id')->get()->map(fn ($doc) => [
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
            'edition' => $edition ? ['id' => $edition->id, 'year' => $edition->year, 'name' => $edition->name, 'registration_is_open' => $edition->registrationIsOpen()] : null,
            'registration_status' => $registration?->status,
            'participant_number' => $registration?->participant_number ?: $registration?->audition_number,
            'audition_number' => $registration?->audition_number ?: $registration?->participant_number,
            'participant_code' => $registration?->participant_code,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'gender' => $profile->gender,
            'nickname' => $profile->nickname,
            'religion' => $profile->religion,
            'national_id' => $profile->national_id,
            'current_status' => $profile->current_status,
            'birth_place' => $profile->birth_place,
            'birth_date' => $profile->birth_date?->format('Y-m-d'),
            'domicile_address' => $profile->domicile_address,
            'ktp_address' => $profile->ktp_address,
            'height_cm' => $profile->height_cm,
            'weight_kg' => $profile->weight_kg,
            'shirt_size' => $profile->shirt_size,
            'chest_circumference_cm' => $profile->chest_circumference_cm,
            'waist_circumference_cm' => $profile->waist_circumference_cm,
            'hip_circumference_cm' => $profile->hip_circumference_cm,
            'pants_size' => $profile->pants_size,
            'shoe_size' => $profile->shoe_size,
            'instagram' => $profile->instagram,
            'tiktok' => $profile->tiktok,
            'parent_phone' => $profile->parent_phone,
            'father_name' => $profile->father_name,
            'mother_name' => $profile->mother_name,
            'photo' => $this->resolveProfilePhoto($profile, $user),
            'education_category' => $profile->education_category,
            'education_institution' => $profile->education_institution,
            'education_major' => $profile->education_major,
            'education_degree' => $profile->education_degree,
            'occupation' => $profile->occupation,
            'skills' => $profile->skills,
            'hobbies' => $profile->hobbies,
            'languages' => $profile->languages,
            'vision' => $profile->vision,
            'mission' => $profile->mission,
            'experience' => $profile->experience,
            'achievement' => $profile->achievement,
            'agreement_no_agency' => $profile->agreement_no_agency,
            'agency_name' => $profile->agency_name,
            'agreement_parent_permission' => $profile->agreement_parent_permission,
            'agreement_all_stages' => $profile->agreement_all_stages,
            'motivation_statement' => $profile->motivation_statement,
            'contribution_idea' => $profile->contribution_idea,
            'public_speaking_experience' => $profile->public_speaking_experience,
            'account_status' => $user->account_status,
            'documents' => $documents,
            'submitted_to_admin' => $registration?->status === 'submitted',
            'submitted_to_admin_at' => $registration?->submitted_at?->toISOString(),
            'selection_status' => $registration?->selection_status,
            'selection_status_updated_at' => $registration?->selection_status_updated_at?->toISOString(),
            'eliminated_in_audition' => (bool) $registration?->eliminated_in_audition,
            'eliminated_at' => $registration?->eliminated_at?->toISOString(),
        ];
    }

    private function currentParticipant(Request $request): ?User
    {
        /** @var User|null $user */
        $user = $request->attributes->get('auth_user');
        if (! $user || $user->role !== 'participant') {
            return null;
        }

        return $user;
    }

    public function show(Request $request): JsonResponse
    {
        $user = $this->currentParticipant($request);
        if (! $user) {
            return response()->json([
                'message' => 'Akses hanya untuk peserta.',
            ], 403);
        }

        return response()->json([
            'message' => 'Data biodata peserta berhasil diambil.',
            'data' => $this->biodataPayload($user->fresh()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $this->currentParticipant($request);
        if (! $user) {
            return response()->json([
                'message' => 'Akses hanya untuk peserta.',
            ], 403);
        }

        $profile = $this->ensureProfile($user);

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'gender' => ['sometimes', 'required', Rule::in(['Encik', 'Puan'])],
            'nickname' => ['sometimes', 'nullable', 'string', 'max:120'],
            'religion' => ['sometimes', 'nullable', 'string', 'max:80'],
            'national_id' => ['sometimes', 'nullable', 'string', 'max:30'],
            'current_status' => ['sometimes', 'nullable', 'string', 'max:120'],
            'birth_place' => ['sometimes', 'nullable', 'string', 'max:120'],
            'birth_date' => ['sometimes', 'nullable', 'date'],
            'domicile_address' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'ktp_address' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'height_cm' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:300'],
            'weight_kg' => ['sometimes', 'nullable', 'string', 'max:30'],
            'shirt_size' => ['sometimes', 'nullable', 'string', 'max:30'],
            'chest_circumference_cm' => ['sometimes', 'nullable', 'string', 'max:30'],
            'waist_circumference_cm' => ['sometimes', 'nullable', 'string', 'max:30'],
            'hip_circumference_cm' => ['sometimes', 'nullable', 'string', 'max:30'],
            'pants_size' => ['sometimes', 'nullable', 'string', 'max:30'],
            'shoe_size' => ['sometimes', 'nullable', 'string', 'max:30'],
            'instagram' => ['sometimes', 'nullable', 'string', 'max:255'],
            'tiktok' => ['sometimes', 'nullable', 'string', 'max:255'],
            'parent_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'father_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'mother_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'photo' => ['sometimes', 'nullable', 'string'],
            'education_category' => ['sometimes', 'nullable', Rule::in(['SMA', 'SMK', 'MA', 'Kuliah'])],
            'education_institution' => ['sometimes', 'nullable', 'string', 'max:255'],
            'education_major' => ['sometimes', 'nullable', 'string', 'max:255'],
            'education_degree' => ['sometimes', 'nullable', 'string', 'max:30'],
            'occupation' => ['sometimes', 'nullable', 'string', 'max:255'],
            'skills' => ['sometimes', 'nullable', 'string'],
            'hobbies' => ['sometimes', 'nullable', 'string'],
            'languages' => ['sometimes', 'nullable', 'string'],
            'vision' => ['sometimes', 'nullable', 'string'],
            'mission' => ['sometimes', 'nullable', 'string'],
            'experience' => ['sometimes', 'nullable', 'string'],
            'achievement' => ['sometimes', 'nullable', 'string'],
            'agreement_no_agency' => ['sometimes', 'nullable', Rule::in(['yes', 'no'])],
            'agency_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'agreement_parent_permission' => ['sometimes', 'nullable', Rule::in(['yes', 'no'])],
            'agreement_all_stages' => ['sometimes', 'nullable', Rule::in(['yes', 'no'])],
            'motivation_statement' => ['sometimes', 'nullable', 'string'],
            'contribution_idea' => ['sometimes', 'nullable', 'string'],
            'public_speaking_experience' => ['sometimes', 'nullable', 'string'],
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
        if (array_key_exists('phone', $payload)) {
            $user->phone = $payload['phone'] ?: null;
        }

        $profileFields = [
            'gender',
            'nickname',
            'religion',
            'national_id',
            'current_status',
            'birth_place',
            'birth_date',
            'domicile_address',
            'ktp_address',
            'height_cm',
            'weight_kg',
            'shirt_size',
            'chest_circumference_cm',
            'waist_circumference_cm',
            'hip_circumference_cm',
            'pants_size',
            'shoe_size',
            'instagram',
            'tiktok',
            'parent_phone',
            'father_name',
            'mother_name',
            'education_category',
            'education_institution',
            'education_major',
            'education_degree',
            'occupation',
            'skills',
            'hobbies',
            'languages',
            'vision',
            'mission',
            'experience',
            'achievement',
            'agreement_no_agency',
            'agency_name',
            'agreement_parent_permission',
            'agreement_all_stages',
            'motivation_statement',
            'contribution_idea',
            'public_speaking_experience',
        ];

        foreach ($profileFields as $field) {
            if (array_key_exists($field, $payload)) {
                $profile->{$field} = $payload[$field] ?: null;
            }
        }

        if (array_key_exists('photo', $payload)) {
            $profile->photo = $this->normalizePhoto($payload['photo'], $profile->photo);
        }

        $user->save();
        $profile->save();

        return response()->json([
            'message' => 'Biodata peserta berhasil diperbarui.',
            'data' => $this->biodataPayload($user->fresh()),
        ]);
    }
}
