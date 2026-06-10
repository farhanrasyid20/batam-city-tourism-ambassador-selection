<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JudgeScore;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class JudgeScoreRecapController extends Controller
{
    private const STAGES = ['Audition', 'Pre Camp', 'Camp', 'Grand Final'];

    private const GENDER_VALUES = ['Encik', 'Puan'];

    /**
     * @var array<string, array<int, string>>
     */
    private const STAGE_CRITERIA_KEYS = [
        'Audition' => [
            'auditionAppearanceEthicsConfidence',
            'auditionCultureTourismKnowledge',
            'auditionCommunicationForeignLanguage',
            'auditionTalent',
        ],
        'Pre Camp' => [
            'preCampAdministrationCompleteness',
            'preCampEssayMotivation',
            'preCampBatamKnowledge',
            'preCampCommunicationPublicSpeaking',
            'preCampEthicsPersonalityAppearance',
            'preCampDigitalLiteracy',
            'preCampCommitmentDiscipline',
        ],
        'Camp' => [
            'campDisciplinePunctuality',
            'campAttitudeEthics',
            'campTourismCultureKnowledge',
            'campPublicSpeakingStorytelling',
            'campForeignLanguage',
            'campTalentCreativity',
            'campPersonalBrandingContent',
            'campProblemSolving',
        ],
        'Grand Final' => [
            'grandFinalAppearanceConfidence',
            'grandFinalCultureTourismKnowledge',
            'grandFinalPublicSpeaking',
        ],
    ];

    /**
     * @param  Collection<int, JudgeScore>  $rows
     * @return array{
     *   judges_count:int,
     *   judge_scores:array<int,float>,
     *   total:float,
     *   average:float
     * }
     */
    private function summarizeStage(Collection $rows): array
    {
        if ($rows->isEmpty()) {
            return [
                'judges_count' => 0,
                'judge_scores' => [],
                'total' => 0.0,
                'average' => 0.0,
            ];
        }

        $judgeScores = $rows
            ->sortBy('judge_user_id')
            ->values()
            ->map(static fn (JudgeScore $score): float => round((float) $score->total_score, 2))
            ->all();

        $total = round(array_sum($judgeScores), 2);
        $judgesCount = count($judgeScores);
        $average = $judgesCount > 0 ? round($total / $judgesCount, 2) : 0.0;

        return [
            'judges_count' => $judgesCount,
            'judge_scores' => $judgeScores,
            'total' => $total,
            'average' => $average,
        ];
    }

    /**
     * @param Collection<int, JudgeScore> $rows
     * @return array<string, float>
     */
    private function summarizeCriteriaAverage(Collection $rows, string $stage): array
    {
        $keys = self::STAGE_CRITERIA_KEYS[$stage] ?? [];
        if (empty($keys)) {
            return [];
        }

        $totals = array_fill_keys($keys, 0.0);
        $counts = array_fill_keys($keys, 0);

        foreach ($rows as $row) {
            $scoreMap = is_array($row->score) ? $row->score : [];
            foreach ($keys as $key) {
                if (! array_key_exists($key, $scoreMap) || ! is_numeric($scoreMap[$key])) {
                    continue;
                }
                $totals[$key] += (float) $scoreMap[$key];
                $counts[$key] += 1;
            }
        }

        $averages = [];
        foreach ($keys as $key) {
            $count = (int) ($counts[$key] ?? 0);
            if ($count <= 0) {
                $averages[$key] = 0.0;
                continue;
            }
            $averages[$key] = round(((float) $totals[$key]) / $count, 2);
        }

        return $averages;
    }

    /**
     * @param  array<string, Collection<int, JudgeScore>>  $scoreGroups
     * @param  array<int, string>  $candidates
     * @return Collection<int, JudgeScore>
     */
    private function pickParticipantScores(array $scoreGroups, array $candidates): Collection
    {
        $result = collect();

        foreach ($candidates as $candidateKey) {
            if (! isset($scoreGroups[$candidateKey])) {
                continue;
            }
            $result = $result->concat($scoreGroups[$candidateKey]);
        }

        return $result
            ->sortByDesc('submitted_at')
            ->unique(static fn (JudgeScore $score): string => $score->stage.'|'.$score->judge_user_id)
            ->values();
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->query(), [
            'gender' => ['nullable', Rule::in(self::GENDER_VALUES)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $participantQuery = User::query()
            ->where('role', 'participant')
            ->with([
                'participantProfile:user_id,participant_number,audition_number,participant_code,gender,admin_score_adjustment,admin_score_adjustment_note,admin_score_adjustment_updated_at',
            ])
            ->orderBy('name');

        if (array_key_exists('gender', $payload)) {
            $participantQuery->whereHas('participantProfile', function ($query) use ($payload): void {
                $query->where('gender', $payload['gender']);
            });
        }

        $participants = $participantQuery->get(['id', 'name']);

        $allScores = JudgeScore::query()
            ->where('score_type', 'official')
            ->whereIn('stage', self::STAGES)
            ->orderByDesc('submitted_at')
            ->get([
                'participant_id',
                'judge_user_id',
                'stage',
                'score',
                'total_score',
                'submitted_at',
            ]);

        $judgeUsers = User::query()
            ->whereIn('id', $allScores->pluck('judge_user_id')->unique()->values())
            ->get(['id', 'name', 'judge_title', 'judge_organization'])
            ->keyBy('id');

        $stageJudges = collect(self::STAGES)
            ->mapWithKeys(function (string $stage) use ($allScores, $judgeUsers): array {
                $judges = $allScores
                    ->where('stage', $stage)
                    ->sortBy('judge_user_id')
                    ->unique('judge_user_id')
                    ->map(function (JudgeScore $score) use ($judgeUsers): array {
                        $judge = $judgeUsers->get($score->judge_user_id);

                        return [
                            'id' => (int) $score->judge_user_id,
                            'name' => $judge?->name ?? 'Juri '.$score->judge_user_id,
                            'title' => $judge?->judge_title,
                            'organization' => $judge?->judge_organization,
                        ];
                    })
                    ->values()
                    ->all();

                return [$stage => $judges];
            })
            ->all();

        /** @var array<string, Collection<int, JudgeScore>> $scoreGroups */
        $scoreGroups = $allScores->groupBy('participant_id')->all();

        $rows = $participants->map(function (User $participant) use ($scoreGroups): array {
            $profile = $participant->participantProfile;

            $participantIdApi = 'P_API_'.$participant->id;

            $candidateKeys = array_values(array_filter([
                $participantIdApi,
                $profile?->participant_code,
                $profile?->audition_number,
                $profile?->participant_number,
            ]));

            $participantScores = $this->pickParticipantScores($scoreGroups, $candidateKeys);

            $audition = $this->summarizeStage(
                $participantScores->where('stage', 'Audition')->values()
            );
            $auditionCriteria = $this->summarizeCriteriaAverage(
                $participantScores->where('stage', 'Audition')->values(),
                'Audition'
            );
            $preCamp = $this->summarizeStage(
                $participantScores->where('stage', 'Pre Camp')->values()
            );
            $preCampCriteria = $this->summarizeCriteriaAverage(
                $participantScores->where('stage', 'Pre Camp')->values(),
                'Pre Camp'
            );
            $camp = $this->summarizeStage(
                $participantScores->where('stage', 'Camp')->values()
            );
            $campCriteria = $this->summarizeCriteriaAverage(
                $participantScores->where('stage', 'Camp')->values(),
                'Camp'
            );
            $grandFinal = $this->summarizeStage(
                $participantScores->where('stage', 'Grand Final')->values()
            );
            $grandFinalCriteria = $this->summarizeCriteriaAverage(
                $participantScores->where('stage', 'Grand Final')->values(),
                'Grand Final'
            );

            $campWeighted = round($camp['average'] * 0.30, 2);
            $grandFinalWeighted = round($grandFinal['average'] * 0.70, 2);
            $finalScoreBase = round($campWeighted + $grandFinalWeighted, 2);
            $adminScoreAdjustment = round((float) ($profile?->admin_score_adjustment ?? 0), 2);
            $finalScore = round($finalScoreBase + $adminScoreAdjustment, 2);

            return [
                'participant_id' => $participantIdApi,
                'participant_number' => $profile?->participant_code
                    ?? $profile?->audition_number
                    ?? $profile?->participant_number
                    ?? '-',
                'participant_name' => $participant->name,
                'gender' => $profile?->gender,
                'audition' => $audition,
                'audition_criteria_average' => $auditionCriteria,
                'pre_camp' => $preCamp,
                'pre_camp_criteria_average' => $preCampCriteria,
                'camp' => $camp,
                'camp_criteria_average' => $campCriteria,
                'grand_final' => $grandFinal,
                'grand_final_criteria_average' => $grandFinalCriteria,
                'audition_total' => $audition['total'],
                'audition_average' => $audition['average'],
                'pre_camp_total' => $preCamp['total'],
                'pre_camp_average' => $preCamp['average'],
                'camp_total' => $camp['total'],
                'camp_average' => $camp['average'],
                'grand_final_total' => $grandFinal['total'],
                'grand_final_average' => $grandFinal['average'],
                'final_score_base' => $finalScoreBase,
                'camp_weighted_30' => $campWeighted,
                'grand_final_weighted_70' => $grandFinalWeighted,
                'admin_score_adjustment' => $adminScoreAdjustment,
                'admin_score_adjustment_note' => $profile?->admin_score_adjustment_note,
                'admin_score_adjustment_updated_at' => $profile?->admin_score_adjustment_updated_at?->toIso8601String(),
                'final_score' => $finalScore,
                'audition_rank' => null,
                'pre_camp_rank' => null,
                'camp_rank' => null,
                'grand_final_rank' => null,
                'final_rank' => null,
            ];
        })->values();

        $setRanks = static function (Collection $items, string $scoreField, string $rankField): Collection {
            $sorted = $items
                ->filter(static fn (array $item): bool => (float) ($item[$scoreField] ?? 0) > 0)
                ->sortByDesc($scoreField)
                ->values();

            $rankMap = [];
            foreach ($sorted as $index => $row) {
                $rankMap[$row['participant_id']] = $index + 1;
            }

            return $items->map(function (array $row) use ($rankMap, $rankField): array {
                $row[$rankField] = $rankMap[$row['participant_id']] ?? null;

                return $row;
            })->values();
        };

        $rows = $setRanks($rows, 'audition_average', 'audition_rank');
        $rows = $setRanks($rows, 'pre_camp_average', 'pre_camp_rank');
        $rows = $setRanks($rows, 'camp_average', 'camp_rank');
        $rows = $setRanks($rows, 'grand_final_average', 'grand_final_rank');
        $rows = $setRanks($rows, 'final_score', 'final_rank');

        $maxJudgeCount = [
            'audition' => (int) $rows->max(static fn (array $row): int => (int) ($row['audition']['judges_count'] ?? 0)),
            'pre_camp' => (int) $rows->max(static fn (array $row): int => (int) ($row['pre_camp']['judges_count'] ?? 0)),
            'camp' => (int) $rows->max(static fn (array $row): int => (int) ($row['camp']['judges_count'] ?? 0)),
            'grand_final' => (int) $rows->max(static fn (array $row): int => (int) ($row['grand_final']['judges_count'] ?? 0)),
        ];

        return response()->json([
            'message' => 'Rekap nilai juri berhasil diambil.',
            'meta' => [
                'weights' => [
                    'camp' => 0.30,
                    'grand_final' => 0.70,
                ],
                'max_judges' => $maxJudgeCount,
                'stage_judges' => $stageJudges,
                'criteria_keys' => self::STAGE_CRITERIA_KEYS,
            ],
            'data' => $rows,
            'total' => $rows->count(),
        ]);
    }

    public function updateAdjustment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'participant_user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(static fn ($query) => $query->where('role', 'participant')),
            ],
            'admin_score_adjustment' => ['required', 'numeric', 'min:-100', 'max:100'],
            'admin_score_adjustment_note' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();
        $authUser = $request->attributes->get('auth_user');

        $profile = ParticipantProfile::query()->firstOrCreate(
            ['user_id' => (int) $payload['participant_user_id']]
        );

        $profile->admin_score_adjustment = round((float) $payload['admin_score_adjustment'], 2);
        $profile->admin_score_adjustment_note = trim((string) ($payload['admin_score_adjustment_note'] ?? '')) ?: null;
        $profile->admin_score_adjustment_updated_at = Carbon::now();
        $profile->admin_score_adjustment_updated_by_user_id = $authUser?->id;
        $profile->save();

        return response()->json([
            'message' => 'Nilai tambahan admin berhasil diperbarui.',
            'data' => [
                'participant_user_id' => (int) $profile->user_id,
                'admin_score_adjustment' => (float) $profile->admin_score_adjustment,
                'admin_score_adjustment_note' => $profile->admin_score_adjustment_note,
                'admin_score_adjustment_updated_at' => $profile->admin_score_adjustment_updated_at?->toIso8601String(),
            ],
        ]);
    }
}
