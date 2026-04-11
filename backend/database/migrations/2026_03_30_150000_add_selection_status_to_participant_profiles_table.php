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
            if (! Schema::hasColumn('participant_profiles', 'selection_status')) {
                $table->string('selection_status', 30)->nullable()->after('submitted_to_admin_at');
            }
            if (! Schema::hasColumn('participant_profiles', 'selection_status_note')) {
                $table->text('selection_status_note')->nullable()->after('selection_status');
            }
            if (! Schema::hasColumn('participant_profiles', 'selection_status_updated_at')) {
                $table->timestamp('selection_status_updated_at')->nullable()->after('selection_status_note');
            }
        });

        DB::table('participant_profiles')
            ->join('users', 'users.id', '=', 'participant_profiles.user_id')
            ->where('users.role', 'participant')
            ->select('participant_profiles.id', 'users.account_status')
            ->orderBy('participant_profiles.id')
            ->chunk(200, function ($rows): void {
                foreach ($rows as $row) {
                    $status = strtolower((string) ($row->account_status ?? '')) === 'suspended' ? 'Rejected' : 'Pending';

                    DB::table('participant_profiles')
                        ->where('id', $row->id)
                        ->update([
                            'selection_status' => $status,
                            'selection_status_updated_at' => now(),
                            'updated_at' => now(),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('participant_profiles', function (Blueprint $table): void {
            $columns = [];
            if (Schema::hasColumn('participant_profiles', 'selection_status')) {
                $columns[] = 'selection_status';
            }
            if (Schema::hasColumn('participant_profiles', 'selection_status_note')) {
                $columns[] = 'selection_status_note';
            }
            if (Schema::hasColumn('participant_profiles', 'selection_status_updated_at')) {
                $columns[] = 'selection_status_updated_at';
            }

            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
