<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CompetitionEdition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class JudgeParticipantController extends Controller
{
    private const DOCUMENT_DEFINITIONS = [
        'identityCard' => ['label' => 'KTP / SIM / Paspor / Kartu Pelajar', 'required' => true],
        'closeUpPhoto' => ['label' => 'Foto Close Up 4R', 'required' => true],
        'fullBodyPhoto' => ['label' => 'Foto Full Body 4R', 'required' => true],
        'formS01' => ['label' => 'Formulir S-01', 'required' => false],
        'formS02' => ['label' => 'Formulir S-02', 'required' => false],
        'formS03' => ['label' => 'Formulir S-03', 'required' => false],
        'formS04' => ['label' => 'Formulir S-04', 'required' => false],
        'certificate' => ['label' => 'Sertifikat / Piagam Prestasi', 'required' => false],
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
        if ($photo !== '' && str_contains($photo, '/participant-documents/')) {
            // Jangan pernah gunakan foto dari dokumen pendaftaran sebagai foto profil.
            return null;
        }

        if ($photo !== '') {
            return $photo;
        }

        $identityPhoto = is_string($user->participantProfile?->identity?->photo)
            ? trim($user->participantProfile->identity->photo)
            : '';
        if ($identityPhoto !== '' && str_contains($identityPhoto, '/participant-documents/')) {
            return null;
        }

        return $identityPhoto !== '' ? $identityPhoto : null;
    }

    public function index(Request $request): JsonResponse
    {
        $edition = $request->filled('edition_id')
            ? CompetitionEdition::query()->find((int) $request->query('edition_id'))
            : CompetitionEdition::active();
        if (! $edition) return response()->json(['message' => 'Edisi lomba tidak ditemukan.', 'data' => [], 'total' => 0], 404);

        $participants = User::query()
            ->where('role', 'participant')
            ->whereHas('participantRegistrations', fn ($query) => $query->where('edition_id', $edition->id))
            ->with([
                'participantProfile:id,user_id,participant_number,audition_number,participant_code,gender,selection_status,selection_status_note,eliminated_in_audition,eliminated_at,submitted_to_admin,submitted_to_admin_at',
                'participantProfile.identity:participant_profile_id,nickname,religion,national_id,current_status,birth_place,birth_date,domicile_address,ktp_address,instagram,tiktok,parent_phone,father_name,mother_name,photo',
                'participantProfile.measurement:participant_profile_id,height_cm,weight_kg,shirt_size,chest_circumference_cm,waist_circumference_cm,hip_circumference_cm,pants_size,shoe_size',
                'participantProfile.background:participant_profile_id,education_category,education_institution,education_degree,education_major,occupation,skills,hobbies,languages',
                'participantProfile.statement:participant_profile_id,vision,mission,experience,achievement,agreement_no_agency,agency_name,agreement_parent_permission,agreement_all_stages,motivation_statement,contribution_idea,public_speaking_experience',
                'participantDocuments' => fn ($query) => $query->where('edition_id', $edition->id),
                'participantRegistrations' => fn ($query) => $query->where('edition_id', $edition->id),
            ])
            ->orderByDesc('id')
            ->get(['id', 'name', 'email', 'phone', 'created_at']);

        $data = $participants->map(function (User $user) use ($edition): array {
            $profile = $user->participantProfile;
            $registration = $user->participantRegistrations->first();
            $selectionStatus = $registration?->selection_status;
            $eliminatedInAudition = (bool) $registration?->eliminated_in_audition;
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
                        'label' => $doc->label ?: (self::DOCUMENT_DEFINITIONS[$key]['label'] ?? $key),
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

            foreach (self::DOCUMENT_DEFINITIONS as $key => $meta) {
                if (! $documents->has($key)) {
                    $documents->put($key, [
                        'key' => $key,
                        'label' => $meta['label'],
                        'required' => (bool) $meta['required'],
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
                'edition_id' => $edition->id,
                'edition_year' => $edition->year,
                'participant_number' => $registration?->participant_number,
                'audition_number' => $registration?->audition_number,
                'participant_code' => $registration?->participant_code,
                'gender' => $registration?->gender ?? $profile?->gender,
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
                'agreement_no_agency' => $profile?->agreement_no_agency,
                'agency_name' => $profile?->agency_name,
                'agreement_parent_permission' => $profile?->agreement_parent_permission,
                'agreement_all_stages' => $profile?->agreement_all_stages,
                'motivation_statement' => $profile?->motivation_statement,
                'contribution_idea' => $profile?->contribution_idea,
                'public_speaking_experience' => $profile?->public_speaking_experience,
                'selection_status' => $selectionStatus,
                'selection_status_note' => $registration?->selection_status_note,
                'selection_stage' => $this->mapSelectionStage($selectionStatus, $eliminatedInAudition),
                'eliminated_in_audition' => $eliminatedInAudition,
                'eliminated_at' => $registration?->eliminated_at?->toIso8601String(),
                'submitted_to_admin' => $registration?->status === 'submitted',
                'submitted_to_admin_at' => $registration?->submitted_at?->toIso8601String(),
                'documents' => $documents,
            ];
        })->values();

        return response()->json([
            'message' => 'Data peserta untuk juri berhasil diambil.',
            'data' => $data,
            'total' => $data->count(),
            'edition' => ['id' => $edition->id, 'year' => $edition->year, 'name' => $edition->name],
        ]);
    }
}
