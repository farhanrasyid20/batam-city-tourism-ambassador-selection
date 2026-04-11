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
        if (! Schema::hasColumn('users', 'judge_assigned_stages')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->json('judge_assigned_stages')->nullable()->after('account_status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'judge_assigned_stages')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('judge_assigned_stages');
            });
        }
    }
};
