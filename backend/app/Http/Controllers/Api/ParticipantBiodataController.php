<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ParticipantBiodataController extends Controller
{
    private function resolveProfilePhoto(?ParticipantProfile $profile, User $user): ?string
    {
        $photo = is_string($profile?->photo) ? trim($profile->photo) : '';
        if ($photo !== '') {
            if (! str_starts_with($photo, '/storage/')) {
                return $photo;
            }

            $storagePath = Str::after($photo, '/storage/');
            if (Storage::disk('public')->exists($storagePath)) {
                return $photo;
            }
        }

        $fallbackDocument = $user->participantDocuments()
            ->whereIn('document_key', ['closeUpPhoto', 'fullBodyPhoto'])
            ->orderByRaw("CASE document_key WHEN 'closeUpPhoto' THEN 0 ELSE 1 END")
            ->orderByDesc('id')
            ->first();

        if (! $fallbackDocument) {
            return $photo !== '' ? $photo : null;
        }

        $rawUrl = is_string($fallbackDocument->url) ? trim($fallbackDocument->url) : '';
        if ($rawUrl !== '') {
            return $rawUrl;
        }

        $rawPath = is_string($fallbackDocument->path) ? trim($fallbackDocument->path) : '';
        if ($rawPath !== '') {
            return '/storage/'.ltrim($rawPath, '/');
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
            'intro_video_url' => $profile->intro_video_url,
            'agreement_no_agency' => $profile->agreement_no_agency,
            'agency_name' => $profile->agency_name,
            'agreement_parent_permission' => $profile->agreement_parent_permission,
            'agreement_all_stages' => $profile->agreement_all_stages,
            'motivation_statement' => $profile->motivation_statement,
            'contribution_idea' => $profile->contribution_idea,
            'public_speaking_experience' => $profile->public_speaking_experience,
            'account_status' => $user->account_status,
            'documents' => $documents,
            'submitted_to_admin' => (bool) $profile->submitted_to_admin,
            'submitted_to_admin_at' => $profile->submitted_to_admin_at?->toISOString(),
            'selection_status' => $profile->selection_status,
            'selection_status_updated_at' => $profile->selection_status_updated_at?->toISOString(),
            'eliminated_in_audition' => (bool) $profile->eliminated_in_audition,
            'eliminated_at' => $profile->eliminated_at?->toISOString(),
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
            'intro_video_url' => ['sometimes', 'nullable', 'url', 'max:500'],
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
            'intro_video_url',
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
