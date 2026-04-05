<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('public_vote_settings', function (Blueprint $table): void {
            $table->boolean('judge_encik_published')->default(false)->after('vote_ranking_published');
            $table->boolean('judge_puan_published')->default(false)->after('judge_encik_published');
            $table->boolean('judge_pair_published')->default(false)->after('judge_puan_published');
            $table->string('judge_encik_display_mode', 30)->default('name_only')->after('judge_pair_published');
            $table->string('judge_puan_display_mode', 30)->default('name_only')->after('judge_encik_display_mode');
            $table->json('judge_encik_winners')->nullable()->after('judge_puan_display_mode');
            $table->json('judge_puan_winners')->nullable()->after('judge_encik_winners');
            $table->json('judge_pair_rankings')->nullable()->after('judge_puan_winners');
        });
    }

    public function down(): void
    {
        Schema::table('public_vote_settings', function (Blueprint $table): void {
            $table->dropColumn([
                'judge_encik_published',
                'judge_puan_published',
                'judge_pair_published',
                'judge_encik_display_mode',
                'judge_puan_display_mode',
                'judge_encik_winners',
                'judge_puan_winners',
                'judge_pair_rankings',
            ]);
        });
    }
};

