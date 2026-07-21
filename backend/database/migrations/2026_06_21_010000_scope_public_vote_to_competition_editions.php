<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $editionId = DB::table('competition_editions')->where('is_active', true)->value('id');
        Schema::table('public_vote_settings', function (Blueprint $table): void {
            $table->foreignId('edition_id')->nullable()->after('id')->constrained('competition_editions')->cascadeOnDelete();
            $table->unique('edition_id', 'public_vote_settings_edition_unique');
        });
        Schema::table('public_vote_candidate_settings', function (Blueprint $table): void {
            $table->dropUnique('public_vote_candidate_settings_participant_user_id_unique');
            $table->foreignId('edition_id')->nullable()->after('id')->constrained('competition_editions')->cascadeOnDelete();
            $table->unique(['edition_id', 'participant_user_id'], 'public_vote_candidates_edition_participant_unique');
        });
        DB::table('public_vote_settings')->whereNull('edition_id')->update(['edition_id' => $editionId]);
        DB::table('public_vote_candidate_settings')->whereNull('edition_id')->update(['edition_id' => $editionId]);
    }

    public function down(): void
    {
        Schema::table('public_vote_candidate_settings', function (Blueprint $table): void {
            $table->dropUnique('public_vote_candidates_edition_participant_unique');
            $table->dropConstrainedForeignId('edition_id');
            $table->unique('participant_user_id');
        });
        Schema::table('public_vote_settings', function (Blueprint $table): void {
            $table->dropUnique('public_vote_settings_edition_unique');
            $table->dropConstrainedForeignId('edition_id');
        });
    }
};
