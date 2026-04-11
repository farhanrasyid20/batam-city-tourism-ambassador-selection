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
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'judge_type')) {
                $table->string('judge_type', 30)->nullable()->after('judge_assigned_stages');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'judge_type')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('judge_type');
            });
        }
    }
};

