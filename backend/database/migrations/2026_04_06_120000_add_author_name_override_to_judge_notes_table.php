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
        Schema::table('judge_notes', function (Blueprint $table): void {
            if (! Schema::hasColumn('judge_notes', 'author_name_override')) {
                $table->string('author_name_override', 255)->nullable()->after('author_user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('judge_notes', function (Blueprint $table): void {
            if (Schema::hasColumn('judge_notes', 'author_name_override')) {
                $table->dropColumn('author_name_override');
            }
        });
    }
};

