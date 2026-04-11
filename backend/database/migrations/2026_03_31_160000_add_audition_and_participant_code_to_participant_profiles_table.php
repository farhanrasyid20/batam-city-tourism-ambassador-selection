<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration definition.
 * Applies and rolls back schema changes for this migration file.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('participant_profiles', function (Blueprint $table): void {
            if (! Schema::hasColumn('participant_profiles', 'audition_number')) {
                $table->string('audition_number', 40)->nullable()->after('participant_number');
            }

            if (! Schema::hasColumn('participant_profiles', 'participant_code')) {
                $table->string('participant_code', 40)->nullable()->after('audition_number');
            }

            if (! Schema::hasColumn('participant_profiles', 'eliminated_in_audition')) {
                $table->boolean('eliminated_in_audition')->default(false)->after('selection_status_updated_at');
            }

            if (! Schema::hasColumn('participant_profiles', 'eliminated_at')) {
                $table->timestamp('eliminated_at')->nullable()->after('eliminated_in_audition');
            }
        });

        DB::table('participant_profiles')
            ->whereNull('audition_number')
            ->whereNotNull('participant_number')
            ->update([
                'audition_number' => DB::raw('participant_number'),
            ]);
    }

    public function down(): void
    {
        Schema::table('participant_profiles', function (Blueprint $table): void {
            $columns = [];
            foreach (['audition_number', 'participant_code', 'eliminated_in_audition', 'eliminated_at'] as $column) {
                if (Schema::hasColumn('participant_profiles', $column)) {
                    $columns[] = $column;
                }
            }
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};

