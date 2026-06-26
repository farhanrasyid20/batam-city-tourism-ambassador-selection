<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judge_score_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('judge_score_id')->constrained('judge_scores')->cascadeOnDelete();
            $table->foreignId('edition_id')->constrained('competition_editions')->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('old_score');
            $table->decimal('old_total_score', 8, 2);
            $table->text('old_note')->nullable();
            $table->text('reason');
            $table->timestamp('revised_at');
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('judge_score_revisions'); }
};
