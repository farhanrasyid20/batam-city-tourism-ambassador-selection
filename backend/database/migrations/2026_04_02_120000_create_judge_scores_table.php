<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration definition.
 * Applies and rolls back schema changes for this migration file.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judge_scores', function (Blueprint $table): void {
            $table->id();
            $table->string('participant_id', 100);
            $table->string('participant_name', 255)->nullable();
            $table->foreignId('judge_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('stage', 30);
            $table->string('score_type', 30)->default('official');
            $table->json('score');
            $table->decimal('total_score', 8, 2);
            $table->text('note')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(
                ['participant_id', 'judge_user_id', 'stage', 'score_type'],
                'judge_scores_unique_submission'
            );
            $table->index(['stage', 'participant_id'], 'judge_scores_stage_participant_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judge_scores');
    }
};

