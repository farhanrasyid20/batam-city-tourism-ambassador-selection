<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicVoteCandidateSetting;
use App\Models\PublicVoteSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class PublicVoteAdminController extends Controller
{
    public function updatePublication(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'vote_top_published' => ['sometimes', 'required', 'boolean'],
            'vote_ranking_published' => ['sometimes', 'required', 'boolean'],
            'judge_encik_published' => ['sometimes', 'required', 'boolean'],
            'judge_puan_published' => ['sometimes', 'required', 'boolean'],
            'judge_pair_published' => ['sometimes', 'required', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $authUser = $request->attributes->get('auth_user');

        if (
            ! $request->has('vote_top_published')
            && ! $request->has('vote_ranking_published')
            && ! $request->has('judge_encik_published')
            && ! $request->has('judge_puan_published')
            && ! $request->has('judge_pair_published')
        ) {
            return response()->json([
                'message' => 'Tidak ada perubahan publikasi yang dikirim.',
            ], 422);
        }

        $payload = [
            'updated_by_user_id' => $authUser?->id,
        ];

        if ($request->has('vote_top_published')) {
            $payload['vote_top_published'] = (bool) $request->boolean('vote_top_published');
        }
        if ($request->has('vote_ranking_published')) {
            $payload['vote_ranking_published'] = (bool) $request->boolean('vote_ranking_published');
        }
        if ($request->has('judge_encik_published')) {
            $payload['judge_encik_published'] = (bool) $request->boolean('judge_encik_published');
        }
        if ($request->has('judge_puan_published')) {
            $payload['judge_puan_published'] = (bool) $request->boolean('judge_puan_published');
        }
        if ($request->has('judge_pair_published')) {
            $payload['judge_pair_published'] = (bool) $request->boolean('judge_pair_published');
        }

        $setting = PublicVoteSetting::query()->updateOrCreate(
            ['id' => 1],
            $payload
        );

        return response()->json([
            'message' => 'Status publikasi vote berhasil diperbarui.',
            'data' => [
                'vote_top_published' => (bool) $setting->vote_top_published,
                'vote_ranking_published' => (bool) ($setting->vote_ranking_published ?? false),
                'judge_encik_published' => (bool) ($setting->judge_encik_published ?? false),
                'judge_puan_published' => (bool) ($setting->judge_puan_published ?? false),
                'judge_pair_published' => false,
            ],
        ]);
    }

    public function updateJuryWinners(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'judge_encik_display_mode' => ['sometimes', 'required', 'in:name_only,name_with_score'],
            'judge_puan_display_mode' => ['sometimes', 'required', 'in:name_only,name_with_score'],
            // allow empty array [] so admin can clear winners/pairs without 422
            'judge_encik_winners' => ['sometimes', 'array'],
            'judge_puan_winners' => ['sometimes', 'array'],
            'judge_pair_rankings' => ['sometimes', 'array'],
            'judge_encik_published' => ['sometimes', 'required', 'boolean'],
            'judge_puan_published' => ['sometimes', 'required', 'boolean'],
            'judge_pair_published' => ['sometimes', 'required', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $authUser = $request->attributes->get('auth_user');

        $hasAnyPayload = $request->hasAny([
            'judge_encik_display_mode',
            'judge_puan_display_mode',
            'judge_encik_winners',
            'judge_puan_winners',
            'judge_pair_rankings',
            'judge_encik_published',
            'judge_puan_published',
            'judge_pair_published',
        ]);

        if (! $hasAnyPayload) {
            return response()->json([
                'message' => 'Tidak ada perubahan juara juri yang dikirim.',
            ], 422);
        }

        $payload = [
            'updated_by_user_id' => $authUser?->id,
        ];

        foreach ([
            'judge_encik_display_mode',
            'judge_puan_display_mode',
            'judge_encik_winners',
            'judge_puan_winners',
            'judge_encik_published',
            'judge_puan_published',
        ] as $field) {
            if ($request->has($field)) {
                $payload[$field] = $request->input($field);
            }
        }

        $setting = PublicVoteSetting::query()->updateOrCreate(
            ['id' => 1],
            $payload
        );

        return response()->json([
            'message' => 'Pengaturan juara versi juri berhasil disimpan.',
            'data' => [
                'judge_encik_display_mode' => (string) ($setting->judge_encik_display_mode ?: 'name_only'),
                'judge_puan_display_mode' => (string) ($setting->judge_puan_display_mode ?: 'name_only'),
                'judge_encik_winners' => $setting->judge_encik_winners ?? [],
                'judge_puan_winners' => $setting->judge_puan_winners ?? [],
                'judge_pair_rankings' => [],
                'judge_encik_published' => (bool) ($setting->judge_encik_published ?? false),
                'judge_puan_published' => (bool) ($setting->judge_puan_published ?? false),
                'judge_pair_published' => false,
            ],
        ]);
    }

    public function updateCandidate(Request $request, int $participantUserId): JsonResponse
    {
        $participant = User::query()
            ->where('id', $participantUserId)
            ->where('role', 'participant')
            ->first();

        if (! $participant) {
            return response()->json([
                'message' => 'Peserta tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'instagram_profile_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'instagram_post_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'official_like_count' => ['sometimes', 'required', 'integer', 'min:0'],
            'is_enabled' => ['sometimes', 'required', 'boolean'],
            'photo' => ['sometimes', 'nullable', 'file', 'image', 'max:5120'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = [];
        if ($request->has('instagram_profile_url')) {
            $payload['instagram_profile_url'] = trim((string) $request->input('instagram_profile_url')) ?: null;
        }
        if ($request->has('instagram_post_url')) {
            $payload['instagram_post_url'] = trim((string) $request->input('instagram_post_url')) ?: null;
        }
        if ($request->has('is_enabled')) {
            $payload['is_enabled'] = (bool) $request->boolean('is_enabled');
        }
        if ($request->has('official_like_count')) {
            $payload['official_like_count'] = max(0, (int) $request->input('official_like_count'));
            $payload['like_updated_at'] = Carbon::now();
        }

        if ($request->hasFile('photo')) {
            $storedPath = $request->file('photo')->store('vote-candidates', 'public');
            $payload['publication_photo'] = '/storage/'.$storedPath;
        }

        $authUser = $request->attributes->get('auth_user');
        $payload['updated_by_user_id'] = $authUser?->id;

        $setting = PublicVoteCandidateSetting::query()->updateOrCreate(
            ['participant_user_id' => $participantUserId],
            $payload
        );

        PublicVoteSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'vote_top_published' => false,
                'vote_ranking_published' => false,
                'updated_by_user_id' => $authUser?->id,
            ]
        );

        return response()->json([
            'message' => 'Pengaturan kandidat vote berhasil disimpan.',
            'data' => [
                'participant_user_id' => $setting->participant_user_id,
                'publication_photo' => $setting->publication_photo,
                'instagram_profile_url' => $setting->instagram_profile_url,
                'instagram_post_url' => $setting->instagram_post_url,
                'official_like_count' => (int) $setting->official_like_count,
                'like_updated_at' => $setting->like_updated_at?->toIso8601String(),
                'is_enabled' => (bool) $setting->is_enabled,
            ],
        ]);
    }
}
