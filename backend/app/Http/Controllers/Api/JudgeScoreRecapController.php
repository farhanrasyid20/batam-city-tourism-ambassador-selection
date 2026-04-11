<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JudgeScore;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class JudgeScoreRecapController extends Controller
{
    private const STAGES = ['Audition', 'Camp', 'Grand Final'];

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
        'Camp' => [
            'campDisciplinePunctuality',
            'campAttitudeEthics',
            'campTeamwork',
            'campActivenessInitiative',
            'campTaskResponsibility',
        ],
        'Grand Final' => [
            'grandFinalAppearancePersonality',
            'grandFinalTourismCultureInsight',
            'grandFinalCommunicationPublicSpeaking',
            'grandFinalIntelligenceAttitude',
            'grandFinalDutaPotential',
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
                'participantProfile:user_id,participant_number,audition_number,participant_code,gender',
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
            $finalScore = round($campWeighted + $grandFinalWeighted, 2);

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
                'camp' => $camp,
                'camp_criteria_average' => $campCriteria,
                'grand_final' => $grandFinal,
                'grand_final_criteria_average' => $grandFinalCriteria,
                'audition_total' => $audition['total'],
                'audition_average' => $audition['average'],
                'camp_total' => $camp['total'],
                'camp_average' => $camp['average'],
                'grand_final_total' => $grandFinal['total'],
                'grand_final_average' => $grandFinal['average'],
                'camp_weighted_30' => $campWeighted,
                'grand_final_weighted_70' => $grandFinalWeighted,
                'final_score' => $finalScore,
                'audition_rank' => null,
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
        $rows = $setRanks($rows, 'camp_average', 'camp_rank');
        $rows = $setRanks($rows, 'grand_final_average', 'grand_final_rank');
        $rows = $setRanks($rows, 'final_score', 'final_rank');

        $maxJudgeCount = [
            'audition' => (int) $rows->max(static fn (array $row): int => (int) ($row['audition']['judges_count'] ?? 0)),
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
                'criteria_keys' => self::STAGE_CRITERIA_KEYS,
            ],
            'data' => $rows,
            'total' => $rows->count(),
        ]);
    }
}
