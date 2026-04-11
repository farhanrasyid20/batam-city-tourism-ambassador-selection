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
        $columns = [
            'religion' => fn (Blueprint $table) => $table->string('religion', 80)->nullable()->after('nickname'),
            'father_name' => fn (Blueprint $table) => $table->string('father_name', 255)->nullable()->after('parent_phone'),
            'mother_name' => fn (Blueprint $table) => $table->string('mother_name', 255)->nullable()->after('father_name'),
            'current_status' => fn (Blueprint $table) => $table->string('current_status', 50)->nullable()->after('national_id'),
        ];

        foreach ($columns as $column => $definition) {
            if (Schema::hasColumn('participant_profiles', $column)) {
                continue;
            }

            Schema::table('participant_profiles', function (Blueprint $table) use ($definition): void {
                $definition($table);
            });
        }
    }

    public function down(): void
    {
        $columns = ['religion', 'father_name', 'mother_name', 'current_status'];
        $existing = array_values(array_filter(
            $columns,
            fn (string $column): bool => Schema::hasColumn('participant_profiles', $column)
        ));

        if (! empty($existing)) {
            Schema::table('participant_profiles', function (Blueprint $table) use ($existing): void {
                $table->dropColumn($existing);
            });
        }
    }
};

