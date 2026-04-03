<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JudgeScore;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class JudgeScoreController extends Controller
{
    private const ALLOWED_STAGES = ['Audition', 'Camp', 'Grand Final'];

    private const ALLOWED_SCORE_TYPES = ['official', 'mentor_observation'];

    private const STAGE_CRITERIA = [
        'Audition' => [
            ['key' => 'auditionAppearanceGrooming', 'weight' => 10],
            ['key' => 'auditionConfidenceBodyLanguage', 'weight' => 10],
            ['key' => 'auditionEthicsPersonality', 'weight' => 10],
            ['key' => 'auditionBatamTourismKnowledge', 'weight' => 10],
            ['key' => 'auditionMalayCultureWisdom', 'weight' => 10],
            ['key' => 'auditionCommunicationPublicSpeaking', 'weight' => 10],
            ['key' => 'auditionIdeaDeliveryAnswering', 'weight' => 10],
            ['key' => 'auditionForeignLanguage', 'weight' => 10],
            ['key' => 'auditionSupportingTalent', 'weight' => 10],
            ['key' => 'auditionVisionMotivationCommitment', 'weight' => 10],
        ],
        'Camp' => [
            ['key' => 'campDisciplinePunctuality', 'weight' => 20],
            ['key' => 'campAttitudeEthics', 'weight' => 20],
            ['key' => 'campTeamwork', 'weight' => 20],
            ['key' => 'campActivenessInitiative', 'weight' => 20],
            ['key' => 'campTaskResponsibility', 'weight' => 20],
        ],
        'Grand Final' => [
            ['key' => 'grandFinalAppearancePersonality', 'weight' => 20],
            ['key' => 'grandFinalTourismCultureInsight', 'weight' => 20],
            ['key' => 'grandFinalCommunicationPublicSpeaking', 'weight' => 20],
            ['key' => 'grandFinalIntelligenceAttitude', 'weight' => 20],
            ['key' => 'grandFinalDutaPotential', 'weight' => 20],
        ],
    ];

    private function toPayload(JudgeScore $score): array
    {
        return [
            'id' => $score->id,
            'participant_id' => $score->participant_id,
            'participant_name' => $score->participant_name,
            'judge_user_id' => $score->judge_user_id,
            'judge_name' => $score->judge?->name,
            'stage' => $score->stage,
            'score_type' => $score->score_type,
            'score' => $score->score,
            'total_score' => (float) $score->total_score,
            'note' => $score->note,
            'submitted_at' => $score->submitted_at?->toISOString(),
            'created_at' => $score->created_at?->toISOString(),
            'updated_at' => $score->updated_at?->toISOString(),
        ];
    }

    /**
     * @param array<string, mixed> $scoreMap
     */
    private function validateScoreByStage(string $stage, array $scoreMap): ?array
    {
        $criteria = self::STAGE_CRITERIA[$stage] ?? [];
        $allowedKeys = array_map(
            static fn (array $item): string => (string) $item['key'],
            $criteria
        );

        $submittedKeys = array_keys($scoreMap);
        $unknownKeys = array_values(array_diff($submittedKeys, $allowedKeys));
        if (! empty($unknownKeys)) {
            return [
                'score' => ['Ada kriteria nilai yang tidak valid untuk tahap '.$stage.'.'],
            ];
        }

        $missingKeys = array_values(array_diff($allowedKeys, $submittedKeys));
        if (! empty($missingKeys)) {
            return [
                'score' => ['Semua kriteria tahap '.$stage.' wajib diisi.'],
            ];
        }

        foreach ($allowedKeys as $key) {
            $value = $scoreMap[$key] ?? null;
            if (! is_numeric($value)) {
                return ['score' => ['Nilai untuk '.$key.' harus berupa angka.']];
            }

            $numeric = (float) $value;
            if ($numeric < 0 || $numeric > 100) {
                return ['score' => ['Nilai untuk '.$key.' harus di rentang 0 - 100.']];
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $scoreMap
     */
    private function calculateTotalByStage(string $stage, array $scoreMap): float
    {
        $criteria = self::STAGE_CRITERIA[$stage] ?? [];
        $total = 0.0;

        foreach ($criteria as $criterion) {
            $key = (string) $criterion['key'];
            $weight = (float) $criterion['weight'];
            $value = (float) ($scoreMap[$key] ?? 0);
            $total += ($value * $weight) / 100;
        }

        return round($total, 2);
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User|null $authUser */
        $authUser = $request->attributes->get('auth_user');
        $authRole = $authUser?->role ?? null;

        $validator = Validator::make($request->query(), [
            'stage' => ['nullable', Rule::in(self::ALLOWED_STAGES)],
            'participant_id' => ['nullable', 'string', 'max:100'],
            'score_type' => ['nullable', Rule::in(self::ALLOWED_SCORE_TYPES)],
            'judge_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();
        $query = JudgeScore::query()->with('judge:id,name');

        if ($authRole === 'judge') {
            $query->where('judge_user_id', $authUser?->id);
        } elseif (array_key_exists('judge_user_id', $payload)) {
            $query->where('judge_user_id', (int) $payload['judge_user_id']);
        }

        if (array_key_exists('stage', $payload)) {
            $query->where('stage', $payload['stage']);
        }
        if (array_key_exists('participant_id', $payload)) {
            $query->where('participant_id', trim((string) $payload['participant_id']));
        }
        if (array_key_exists('score_type', $payload)) {
            $query->where('score_type', $payload['score_type']);
        }

        $scores = $query
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'message' => 'Data nilai juri berhasil diambil.',
            'data' => $scores->map(fn (JudgeScore $score): array => $this->toPayload($score))->values(),
            'total' => $scores->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User|null $authUser */
        $authUser = $request->attributes->get('auth_user');
        if (! $authUser || $authUser->role !== 'judge') {
            return response()->json([
                'message' => 'Hanya akun juri yang dapat mengirim nilai.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'participant_id' => ['required', 'string', 'max:100'],
            'participant_name' => ['nullable', 'string', 'max:255'],
            'stage' => ['required', Rule::in(self::ALLOWED_STAGES)],
            'score_type' => ['nullable', Rule::in(self::ALLOWED_SCORE_TYPES)],
            'score' => ['required', 'array', 'min:1'],
            'score.*' => ['required', 'numeric', 'min:0', 'max:100'],
            'note' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();
        $stage = (string) $payload['stage'];
        $scoreMap = is_array($payload['score']) ? $payload['score'] : [];
        $criteriaErrors = $this->validateScoreByStage($stage, $scoreMap);
        if ($criteriaErrors) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $criteriaErrors,
            ], 422);
        }

        $totalScore = $this->calculateTotalByStage($stage, $scoreMap);
        $scoreType = (string) ($payload['score_type'] ?? 'official');

        $record = JudgeScore::query()->updateOrCreate(
            [
                'participant_id' => trim((string) $payload['participant_id']),
                'judge_user_id' => (int) $authUser->id,
                'stage' => $stage,
                'score_type' => $scoreType,
            ],
            [
                'participant_name' => isset($payload['participant_name'])
                    ? trim((string) $payload['participant_name'])
                    : null,
                'score' => $scoreMap,
                'total_score' => $totalScore,
                'note' => isset($payload['note']) ? trim((string) $payload['note']) : null,
                'submitted_at' => Carbon::now(),
            ]
        );

        $record->load('judge:id,name');

        return response()->json([
            'message' => 'Nilai juri berhasil disimpan ke database.',
            'data' => $this->toPayload($record),
        ], 201);
    }
}

