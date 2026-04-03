<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JudgeParticipantController extends Controller
{
    private function mapSelectionStage(?string $selectionStatus): string
    {
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

    public function index(Request $request): JsonResponse
    {
        $participants = User::query()
            ->where('role', 'participant')
            ->with([
                'participantProfile:user_id,participant_number,audition_number,participant_code,gender,height_cm,photo,education_category,education_institution,education_degree,education_major,selection_status',
            ])
            ->orderByDesc('id')
            ->get(['id', 'name', 'email', 'phone', 'created_at']);

        $data = $participants->map(function (User $user): array {
            $profile = $user->participantProfile;
            $selectionStatus = $profile?->selection_status;

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
                'height_cm' => $profile?->height_cm,
                'photo' => $profile?->photo,
                'education_category' => $profile?->education_category,
                'education_institution' => $profile?->education_institution,
                'education_degree' => $profile?->education_degree,
                'education_major' => $profile?->education_major,
                'selection_status' => $selectionStatus,
                'selection_stage' => $this->mapSelectionStage($selectionStatus),
            ];
        })->values();

        return response()->json([
            'message' => 'Data peserta untuk juri berhasil diambil.',
            'data' => $data,
            'total' => $data->count(),
        ]);
    }
}

