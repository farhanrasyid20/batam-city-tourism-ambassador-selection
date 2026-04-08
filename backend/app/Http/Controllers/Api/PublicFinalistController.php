<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicVoteCandidateSetting;
use App\Models\PublicVoteSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PublicFinalistController extends Controller
{
    public function index(): JsonResponse
    {
        $participants = User::query()
            ->where('role', 'participant')
            ->whereHas('participantProfile', function ($query): void {
                // Untuk kebutuhan halaman vote publik, tampilkan peserta yang sudah lolos audisi
                // (minimal Top 20) hingga tahap final.
                $query
                    ->whereIn('selection_status', ['Top20', 'PreCamp', 'Camp', 'GrandFinal', 'Winner'])
                    ->where(function ($inner): void {
                        $inner
                            ->whereNull('eliminated_in_audition')
                            ->orWhere('eliminated_in_audition', false);
                    });
            })
            ->with([
                'participantProfile:user_id,participant_number,audition_number,participant_code,gender,photo,instagram,education_category,education_institution,education_degree,education_major,selection_status,eliminated_in_audition',
            ])
            ->orderBy('name')
            ->get(['id', 'name']);

        $settingsByParticipant = PublicVoteCandidateSetting::query()
            ->whereIn('participant_user_id', $participants->pluck('id')->all())
            ->get()
            ->keyBy('participant_user_id');

        $publicationSetting = PublicVoteSetting::query()->find(1);

        $data = $participants->map(function (User $user) use ($settingsByParticipant): array {
            $profile = $user->participantProfile;
            $setting = $settingsByParticipant->get($user->id);
            $photo = $setting?->publication_photo ?: $profile?->photo;

            return [
                'id' => $user->id,
                'name' => $user->name,
                'participant_number' => $profile?->participant_number,
                'audition_number' => $profile?->audition_number,
                'participant_code' => $profile?->participant_code,
                'gender' => $profile?->gender,
                'photo' => $photo,
                'instagram' => $profile?->instagram,
                'education_category' => $profile?->education_category,
                'education_institution' => $profile?->education_institution,
                'education_degree' => $profile?->education_degree,
                'education_major' => $profile?->education_major,
                'selection_status' => $profile?->selection_status,
                'vote_instagram_profile_url' => $setting?->instagram_profile_url,
                'vote_instagram_post_url' => $setting?->instagram_post_url,
                'vote_official_like_count' => $setting?->official_like_count,
                'vote_like_updated_at' => $setting?->like_updated_at?->toIso8601String(),
                'vote_is_enabled' => $setting?->is_enabled,
            ];
        })->values();

        return response()->json([
            'message' => 'Data finalis publik berhasil diambil.',
            'data' => $data,
            'total' => $data->count(),
            'vote_top_published' => (bool) ($publicationSetting?->vote_top_published ?? false),
            'vote_ranking_published' => (bool) ($publicationSetting?->vote_ranking_published ?? false),
            'judge_encik_published' => (bool) ($publicationSetting?->judge_encik_published ?? false),
            'judge_puan_published' => (bool) ($publicationSetting?->judge_puan_published ?? false),
            'judge_pair_published' => (bool) ($publicationSetting?->judge_pair_published ?? false),
            'judge_encik_display_mode' => (string) ($publicationSetting?->judge_encik_display_mode ?? 'name_only'),
            'judge_puan_display_mode' => (string) ($publicationSetting?->judge_puan_display_mode ?? 'name_only'),
            'judge_encik_winners' => $publicationSetting?->judge_encik_winners ?? [],
            'judge_puan_winners' => $publicationSetting?->judge_puan_winners ?? [],
            'judge_pair_rankings' => $publicationSetting?->judge_pair_rankings ?? [],
        ]);
    }
}
