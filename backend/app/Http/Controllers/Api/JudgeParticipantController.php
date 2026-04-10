<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class JudgeParticipantController extends Controller
{
    private const REQUIRED_DOCUMENTS = [
        'identityCard' => 'KTP / SIM / Paspor / Kartu Pelajar',
        'closeUpPhoto' => 'Foto Close Up 4R',
        'fullBodyPhoto' => 'Foto Full Body 4R',
        'formS01' => 'Formulir S-01',
        'formS02' => 'Formulir S-02',
        'formS03' => 'Formulir S-03',
        'formS04' => 'Formulir S-04',
    ];

    private function mapSelectionStage(?string $selectionStatus, bool $eliminatedInAudition = false): string
    {
        if ($eliminatedInAudition || $selectionStatus === 'Rejected') {
            return 'Audition';
        }

        return match ($selectionStatus) {
            'Audition' => 'Audition',
            'Top20', 'PreCamp' => 'Pre Camp',
            'Camp' => 'Camp',
            'GrandFinal' => 'Grand Final',
            'Winner' => 'Final Result',
            'Verified', 'TechnicalMeeting' => 'Technical Meeting',
            default => 'Verification',
        };
    }

    private function resolveProfilePhoto(User $user): ?string
    {
        $photo = is_string($user->participantProfile?->photo) ? trim($user->participantProfile->photo) : '';
        if ($photo !== '') {
            if (! str_starts_with($photo, '/storage/')) {
                return $photo;
            }

            $storagePath = Str::after($photo, '/storage/');
            if (Storage::disk('public')->exists($storagePath)) {
                return $photo;
            }
        }

        $fallbackDocument = $user->participantDocuments
            ->sortByDesc('id')
            ->sortBy(fn ($doc) => $doc->document_key === 'closeUpPhoto' ? 0 : ($doc->document_key === 'fullBodyPhoto' ? 1 : 2))
            ->first(fn ($doc) => in_array($doc->document_key, ['closeUpPhoto', 'fullBodyPhoto'], true));

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

    public function index(Request $request): JsonResponse
    {
        $participants = User::query()
            ->where('role', 'participant')
            ->with([
                'participantProfile:user_id,participant_number,audition_number,participant_code,gender,nickname,religion,national_id,current_status,birth_place,birth_date,domicile_address,ktp_address,height_cm,weight_kg,shirt_size,chest_circumference_cm,waist_circumference_cm,hip_circumference_cm,pants_size,shoe_size,instagram,tiktok,parent_phone,father_name,mother_name,photo,education_category,education_institution,education_degree,education_major,occupation,skills,hobbies,languages,vision,mission,experience,achievement,selection_status,selection_status_note,eliminated_in_audition,eliminated_at,submitted_to_admin,submitted_to_admin_at',
                'participantDocuments:user_id,document_key,label,is_required,status,original_name,size_bytes,mime_type,path,url,uploaded_at,note',
            ])
            ->orderByDesc('id')
            ->get(['id', 'name', 'email', 'phone', 'created_at']);

        $data = $participants->map(function (User $user): array {
            $profile = $user->participantProfile;
            $selectionStatus = $profile?->selection_status;
            $eliminatedInAudition = (bool) $profile?->eliminated_in_audition;
            $documents = $user->participantDocuments
                ->sortBy('document_key')
                ->map(function ($doc): array {
                    $key = (string) $doc->document_key;
                    $rawUrl = is_string($doc->url) ? trim($doc->url) : '';
                    $rawPath = is_string($doc->path) ? trim($doc->path) : '';
                    $resolvedUrl = null;
                    if ($rawUrl !== '') {
                        $resolvedUrl = str_starts_with($rawUrl, 'http://') || str_starts_with($rawUrl, 'https://')
                            ? $rawUrl
                            : asset(ltrim($rawUrl, '/'));
                    } elseif ($rawPath !== '') {
                        $resolvedUrl = asset('storage/'.ltrim($rawPath, '/'));
                    }
                    $rawOriginalName = is_string($doc->original_name) ? trim($doc->original_name) : '';
                    $rawStatus = is_string($doc->status) ? trim($doc->status) : '';
                    $hasUploadedFile = $resolvedUrl !== null || $rawPath !== '' || $rawOriginalName !== '';
                    $normalizedStatus = $hasUploadedFile ? ($rawStatus !== '' ? $rawStatus : 'submitted') : 'missing';

                    return [
                        'key' => $key,
                        'label' => $doc->label ?: (self::REQUIRED_DOCUMENTS[$key] ?? $key),
                        'required' => (bool) $doc->is_required,
                        'status' => $normalizedStatus,
                        'original_name' => $doc->original_name,
                        'size_bytes' => $doc->size_bytes,
                        'mime_type' => $doc->mime_type,
                        'path' => $doc->path,
                        'url' => $resolvedUrl,
                        'uploaded_at' => $doc->uploaded_at?->toIso8601String(),
                        'note' => $doc->note,
                    ];
                })
                ->keyBy('key');

            foreach (self::REQUIRED_DOCUMENTS as $key => $label) {
                if (! $documents->has($key)) {
                    $documents->put($key, [
                        'key' => $key,
                        'label' => $label,
                        'required' => true,
                        'status' => 'missing',
                        'original_name' => null,
                        'size_bytes' => null,
                        'mime_type' => null,
                        'path' => null,
                        'url' => null,
                        'uploaded_at' => null,
                        'note' => null,
                    ]);
                }
            }

            $documents = $documents
                ->values();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'registered_at' => $user->created_at?->toDateString(),
                'participant_number' => $profile?->participant_number,
                'audition_number' => $profile?->audition_number,
                'participant_code' => $profile?->participant_code,
                'gender' => $profile?->gender,
                'nickname' => $profile?->nickname,
                'religion' => $profile?->religion,
                'national_id' => $profile?->national_id,
                'current_status' => $profile?->current_status,
                'birth_place' => $profile?->birth_place,
                'birth_date' => $profile?->birth_date?->toDateString(),
                'domicile_address' => $profile?->domicile_address,
                'ktp_address' => $profile?->ktp_address,
                'height_cm' => $profile?->height_cm,
                'weight_kg' => $profile?->weight_kg,
                'shirt_size' => $profile?->shirt_size,
                'chest_circumference_cm' => $profile?->chest_circumference_cm,
                'waist_circumference_cm' => $profile?->waist_circumference_cm,
                'hip_circumference_cm' => $profile?->hip_circumference_cm,
                'pants_size' => $profile?->pants_size,
                'shoe_size' => $profile?->shoe_size,
                'instagram' => $profile?->instagram,
                'tiktok' => $profile?->tiktok,
                'parent_phone' => $profile?->parent_phone,
                'father_name' => $profile?->father_name,
                'mother_name' => $profile?->mother_name,
                'photo' => $this->resolveProfilePhoto($user),
                'education_category' => $profile?->education_category,
                'education_institution' => $profile?->education_institution,
                'education_degree' => $profile?->education_degree,
                'education_major' => $profile?->education_major,
                'occupation' => $profile?->occupation,
                'skills' => $profile?->skills,
                'hobbies' => $profile?->hobbies,
                'languages' => $profile?->languages,
                'vision' => $profile?->vision,
                'mission' => $profile?->mission,
                'experience' => $profile?->experience,
                'achievement' => $profile?->achievement,
                'selection_status' => $selectionStatus,
                'selection_status_note' => $profile?->selection_status_note,
                'selection_stage' => $this->mapSelectionStage($selectionStatus, $eliminatedInAudition),
                'eliminated_in_audition' => $eliminatedInAudition,
                'eliminated_at' => $profile?->eliminated_at?->toIso8601String(),
                'submitted_to_admin' => (bool) $profile?->submitted_to_admin,
                'submitted_to_admin_at' => $profile?->submitted_to_admin_at?->toIso8601String(),
                'documents' => $documents,
            ];
        })->values();

        return response()->json([
            'message' => 'Data peserta untuk juri berhasil diambil.',
            'data' => $data,
            'total' => $data->count(),
        ]);
    }
}
