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
            if (! Schema::hasColumn('users', 'judge_title')) {
                $table->string('judge_title', 255)->nullable()->after('judge_assigned_stages');
            }
            if (! Schema::hasColumn('users', 'judge_organization')) {
                $table->string('judge_organization', 255)->nullable()->after('judge_title');
            }
            if (! Schema::hasColumn('users', 'judge_avatar')) {
                $table->string('judge_avatar', 500)->nullable()->after('judge_organization');
            }
        });
    }

    public function down(): void
    {
        $columns = ['judge_title', 'judge_organization', 'judge_avatar'];
        $existing = array_values(array_filter(
            $columns,
            fn (string $column): bool => Schema::hasColumn('users', $column)
        ));

        if (! empty($existing)) {
            Schema::table('users', function (Blueprint $table) use ($existing): void {
                $table->dropColumn($existing);
            });
        }
    }
};
