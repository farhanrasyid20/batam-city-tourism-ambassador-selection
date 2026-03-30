<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            DB::table('participant_profiles')
                ->where(function ($query): void {
                    $query->where('submitted_to_admin', false)
                        ->orWhereNull('submitted_to_admin_at');
                })
                ->update([
                    'participant_number' => null,
                    'updated_at' => now(),
                ]);

            $profiles = DB::table('participant_profiles')
                ->join('users', 'users.id', '=', 'participant_profiles.user_id')
                ->where('users.role', 'participant')
                ->where('participant_profiles.submitted_to_admin', true)
                ->whereNotNull('participant_profiles.submitted_to_admin_at')
                ->orderBy('participant_profiles.submitted_to_admin_at')
                ->orderBy('participant_profiles.id')
                ->select('participant_profiles.id')
                ->get();

            $counter = 1;
            foreach ($profiles as $profile) {
                DB::table('participant_profiles')
                    ->where('id', $profile->id)
                    ->update([
                        'participant_number' => 'P-'.str_pad((string) $counter, 3, '0', STR_PAD_LEFT),
                        'updated_at' => now(),
                    ]);

                $counter++;
            }
        });
    }

    public function down(): void
    {
        // Irreversible normalization migration.
    }
};
