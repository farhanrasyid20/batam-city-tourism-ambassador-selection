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
        Schema::table('public_vote_settings', function (Blueprint $table): void {
            $table->boolean('vote_ranking_published')->default(false)->after('vote_top_published');
        });
    }

    public function down(): void
    {
        Schema::table('public_vote_settings', function (Blueprint $table): void {
            $table->dropColumn('vote_ranking_published');
        });
    }
};

