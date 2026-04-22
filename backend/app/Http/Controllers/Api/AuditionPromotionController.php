<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JudgeScore;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class AuditionPromotionController extends Controller
{
    private const STAGE = 'Audition';
    private const SCORE_TYPE = 'official';
    private const PREVIEW_STATUSES = [
        'Pending',
        'Verified',
        'TechnicalMeeting',
        'Audition',
        'PreCamp',
        'Camp',
        'GrandFinal',
        'Winner',
    ];
    private const APPLY_STATUSES = [
        'Pending',
        'Verified',
        'TechnicalMeeting',
        'Audition',
        'PreCamp',
        'Camp',
        'GrandFinal',
    ];
    private const PROMOTED_STATUS = 'PreCamp';
    private const REJECTED_STATUS = 'Rejected';

    private function buildFinalParticipantCode(string $gender, int $rank): string
    {
        $normalizedRank = max(1, $rank);
        $number = $gender === 'Puan'
            ? ($normalizedRank * 2)
            : (($normalizedRank * 2) - 1);

        $prefix = $gender === 'Puan' ? 'PUA' : 'ECK';

        return sprintf('%s-%03d', $prefix, $number);
    }

    /**
     * @return Collection<int, User>
     */
    private function auditionCandidatesForPreview(): Collection
    {
        return User::query()
            ->where('role', 'participant')
            ->whereHas('participantProfile', function ($query): void {
                $query
                    ->whereNull('selection_status')
                    ->orWhereIn('selection_status', self::PREVIEW_STATUSES);
            })
            ->with([
                'participantProfile:user_id,participant_code,audition_number,participant_number,gender,selection_status',
                'participantProfile.identity:participant_profile_id,nickname',
            ])
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return Collection<int, User>
     */
    private function auditionCandidatesForApply(): Collection
    {
        return User::query()
            ->where('role', 'participant')
            ->whereHas('participantProfile', function ($query): void {
                $query
                    ->whereNull('selection_status')
                    ->orWhereIn('selection_status', self::APPLY_STATUSES);
            })
            ->with([
                'participantProfile:user_id,participant_code,audition_number,participant_number,gender,selection_status',
                'participantProfile.identity:participant_profile_id,nickname',
            ])
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return array<int, string>
     */
    private function buildCandidateKeys(User $participant): array
    {
        $profile = $participant->participantProfile;
        return array_values(array_filter([
            'P_API_'.$participant->id,
            $profile?->participant_code,
            $profile?->audition_number,
            $profile?->participant_number,
        ]));
    }

    /**
     * @param Collection<int, JudgeScore> $scores
     */
    private function latestScoresPerJudge(Collection $scores): Collection
    {
        return $scores
            ->sortByDesc('submitted_at')
            ->sortByDesc('id')
            ->unique('judge_user_id')
            ->values();
    }

    /**
     * @param Collection<int, User> $participants
     * @return array<string, mixed>
     */
    private function buildPreviewPayload(Collection $participants): array
    {
        $allScores = JudgeScore::query()
            ->where('stage', self::STAGE)
            ->where('score_type', self::SCORE_TYPE)
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'participant_id',
                'judge_user_id',
                'total_score',
                'submitted_at',
            ]);

        /** @var array<string, Collection<int, JudgeScore>> $scoreGroups */
        $scoreGroups = $allScores->groupBy('participant_id')->all();

        $rows = $participants->map(function (User $participant) use ($scoreGroups): array {
            $profile = $participant->participantProfile;
            $keys = $this->buildCandidateKeys($participant);

            $participantScores = collect();
            foreach ($keys as $key) {
                if (! isset($scoreGroups[$key])) {
                    continue;
                }
                $participantScores = $participantScores->concat($scoreGroups[$key]);
            }

            $latestPerJudge = $this->latestScoresPerJudge($participantScores);
            $judgeCount = $latestPerJudge->count();
            $total = round((float) $latestPerJudge->sum('total_score'), 2);
            $average = $judgeCount > 0 ? round($total / $judgeCount, 2) : 0.0;

            return [
                'user_id' => $participant->id,
                'participant_id' => 'P_API_'.$participant->id,
                'name' => $participant->name,
                'nickname' => $profile?->nickname,
                'gender' => $profile?->gender,
                'participant_code' => $profile?->participant_code,
                'audition_number' => $profile?->audition_number,
                'selection_status' => $profile?->selection_status,
                'judges_count' => $judgeCount,
                'audition_total' => $total,
                'audition_average' => $average,
            ];
        })->values();

        $scoredRows = $rows
            ->filter(fn (array $row): bool => (float) $row['audition_average'] > 0)
            ->values();

        $encik = $scoredRows
            ->where('gender', 'Encik')
            ->sortByDesc('audition_average')
            ->values();

        $puan = $scoredRows
            ->where('gender', 'Puan')
            ->sortByDesc('audition_average')
            ->values();

        $encikTop = $encik->take(10)->values();
        $puanTop = $puan->take(10)->values();

        return [
            'meta' => [
                'stage' => self::STAGE,
                'score_type' => self::SCORE_TYPE,
                'candidate_total' => $rows->count(),
                'candidate_scored' => $scoredRows->count(),
                'encik_scored' => $encik->count(),
                'puan_scored' => $puan->count(),
                'encik_promoted_target' => 10,
                'puan_promoted_target' => 10,
            ],
            'top_encik' => $encikTop->map(function (array $row, int $index): array {
                $row['rank'] = $index + 1;
                return $row;
            })->values(),
            'top_puan' => $puanTop->map(function (array $row, int $index): array {
                $row['rank'] = $index + 1;
                return $row;
            })->values(),
            'all_candidates' => $rows,
        ];
    }

    public function preview(): JsonResponse
    {
        $candidates = $this->auditionCandidatesForPreview();
        $payload = $this->buildPreviewPayload($candidates);

        return response()->json([
            'message' => 'Preview Top 20 Audisi berhasil diambil.',
            'data' => $payload,
        ]);
    }

    public function apply(): JsonResponse
    {
        $authUser = request()->attributes->get('auth_user');
        $now = Carbon::now();
        $candidates = $this->auditionCandidatesForApply();
        $preview = $this->buildPreviewPayload($candidates);

        /** @var Collection<int, array> $topEncik */
        $topEncik = collect($preview['top_encik'] ?? []);
        /** @var Collection<int, array> $topPuan */
        $topPuan = collect($preview['top_puan'] ?? []);
        $promotedRows = $topEncik->concat($topPuan)->values();

        $promotedCodeMap = [];
        foreach ($topEncik as $row) {
            $userId = (int) ($row['user_id'] ?? 0);
            $rank = (int) ($row['rank'] ?? 0);
            if ($userId <= 0 || $rank <= 0) {
                continue;
            }
            $promotedCodeMap[$userId] = $this->buildFinalParticipantCode('Encik', $rank);
        }
        foreach ($topPuan as $row) {
            $userId = (int) ($row['user_id'] ?? 0);
            $rank = (int) ($row['rank'] ?? 0);
            if ($userId <= 0 || $rank <= 0) {
                continue;
            }
            $promotedCodeMap[$userId] = $this->buildFinalParticipantCode('Puan', $rank);
        }

        $promotedUserIds = $promotedRows
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $candidateUserIds = $candidates->pluck('id')->map(fn ($id) => (int) $id)->values();
        $rejectedUserIds = $candidateUserIds
            ->filter(fn (int $id): bool => ! $promotedUserIds->contains($id))
            ->values();

        DB::transaction(function () use ($promotedUserIds, $rejectedUserIds, $now, $promotedCodeMap): void {
            if ($promotedUserIds->isNotEmpty()) {
                foreach ($promotedUserIds as $userId) {
                    ParticipantProfile::query()
                        ->where('user_id', $userId)
                        ->update([
                            'participant_code' => $promotedCodeMap[$userId] ?? null,
                            'selection_status' => self::PROMOTED_STATUS,
                            'selection_status_note' => 'Lolos 20 besar audisi (otomatis).',
                            'selection_status_updated_at' => $now,
                            'eliminated_in_audition' => false,
                            'eliminated_at' => null,
                        ]);
                }
            }

            if ($rejectedUserIds->isNotEmpty()) {
                ParticipantProfile::query()
                    ->whereIn('user_id', $rejectedUserIds->all())
                    ->update([
                        'selection_status' => self::REJECTED_STATUS,
                        'selection_status_note' => 'Maaf, Anda tidak lolos tahap audisi. Silakan coba kembali tahun depan.',
                        'selection_status_updated_at' => $now,
                        'eliminated_in_audition' => true,
                        'eliminated_at' => $now,
                    ]);
            }
        });

        return response()->json([
            'message' => 'Apply Top 20 Audisi berhasil. Status peserta telah disinkronkan.',
            'data' => [
                'applied_by' => [
                    'id' => $authUser?->id,
                    'name' => $authUser?->name,
                ],
                'applied_at' => $now->toISOString(),
                'promoted_total' => $promotedUserIds->count(),
                'rejected_total' => $rejectedUserIds->count(),
                'promoted_user_ids' => $promotedUserIds->all(),
                'rejected_user_ids' => $rejectedUserIds->all(),
                'top_encik' => $preview['top_encik'] ?? [],
                'top_puan' => $preview['top_puan'] ?? [],
            ],
        ]);
    }
}
