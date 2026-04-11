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
        Schema::create('judge_notes', function (Blueprint $table): void {
            $table->id();
            $table->string('participant_id', 100);
            $table->string('participant_name', 255)->nullable();
            $table->foreignId('author_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('stage', 30);
            $table->string('author_role', 20)->default('judge');
            $table->text('content');
            $table->timestamp('created_at_note');
            $table->timestamps();

            $table->index(['participant_id', 'stage'], 'judge_notes_participant_stage_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judge_notes');
    }
};

