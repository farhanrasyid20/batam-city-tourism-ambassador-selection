<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @return array<string, array<string, float>>
     */
    private function stageCriteriaMap(): array
    {
        return [
            'Audition' => [
                'auditionAppearanceGrooming' => 10,
                'auditionConfidenceBodyLanguage' => 10,
                'auditionEthicsPersonality' => 10,
                'auditionBatamTourismKnowledge' => 10,
                'auditionMalayCultureWisdom' => 10,
                'auditionCommunicationPublicSpeaking' => 10,
                'auditionIdeaDeliveryAnswering' => 10,
                'auditionForeignLanguage' => 10,
                'auditionSupportingTalent' => 10,
                'auditionVisionMotivationCommitment' => 10,
            ],
            'Camp' => [
                'campDisciplinePunctuality' => 20,
                'campAttitudeEthics' => 20,
                'campTeamwork' => 20,
                'campActivenessInitiative' => 20,
                'campTaskResponsibility' => 20,
            ],
            'Grand Final' => [
                'grandFinalAppearancePersonality' => 20,
                'grandFinalTourismCultureInsight' => 20,
                'grandFinalCommunicationPublicSpeaking' => 20,
                'grandFinalIntelligenceAttitude' => 20,
                'grandFinalDutaPotential' => 20,
            ],
        ];
    }

    public function up(): void
    {
        Schema::create('judge_score_details', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('judge_score_id')->constrained('judge_scores')->cascadeOnDelete();
            $table->string('participant_id', 100);
            $table->foreignId('judge_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('stage', 30);
            $table->string('score_type', 30)->default('official');
            $table->string('criterion_key', 120);
            $table->decimal('criterion_weight', 5, 2);
            $table->decimal('criterion_value', 8, 2);
            $table->decimal('weighted_value', 8, 2);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['judge_score_id', 'criterion_key'],
                'judge_score_details_unique_criterion'
            );
            $table->index(
                ['participant_id', 'stage', 'score_type'],
                'judge_score_details_participant_stage_idx'
            );
            $table->index(
                ['stage', 'criterion_key'],
                'judge_score_details_stage_criterion_idx'
            );
        });

        // Backfill detail kriteria dari data judge_scores yang sudah ada.
        $criteriaMapByStage = $this->stageCriteriaMap();
        $now = now();

        $rows = DB::table('judge_scores')
            ->select([
                'id',
                'participant_id',
                'judge_user_id',
                'stage',
                'score_type',
                'score',
                'submitted_at',
            ])
            ->get();

        $inserts = [];
        foreach ($rows as $row) {
            $stage = (string) $row->stage;
            $criteriaMap = $criteriaMapByStage[$stage] ?? [];
            if (empty($criteriaMap)) {
                continue;
            }

            $scoreMap = [];
            if (is_string($row->score)) {
                $decoded = json_decode($row->score, true);
                if (is_array($decoded)) {
                    $scoreMap = $decoded;
                }
            } elseif (is_array($row->score)) {
                $scoreMap = $row->score;
            }

            foreach ($criteriaMap as $criterionKey => $weight) {
                $criterionValue = (float) ($scoreMap[$criterionKey] ?? 0);
                $weightedValue = round(($criterionValue * $weight) / 100, 2);

                $inserts[] = [
                    'judge_score_id' => (int) $row->id,
                    'participant_id' => (string) $row->participant_id,
                    'judge_user_id' => (int) $row->judge_user_id,
                    'stage' => $stage,
                    'score_type' => (string) $row->score_type,
                    'criterion_key' => $criterionKey,
                    'criterion_weight' => $weight,
                    'criterion_value' => $criterionValue,
                    'weighted_value' => $weightedValue,
                    'submitted_at' => $row->submitted_at,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if (count($inserts) >= 500) {
                    DB::table('judge_score_details')->insert($inserts);
                    $inserts = [];
                }
            }
        }

        if (! empty($inserts)) {
            DB::table('judge_score_details')->insert($inserts);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('judge_score_details');
    }
};

