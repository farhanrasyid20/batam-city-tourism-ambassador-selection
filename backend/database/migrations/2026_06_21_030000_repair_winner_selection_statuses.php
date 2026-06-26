<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = DB::table('public_vote_settings')->whereNotNull('edition_id')->get();

        foreach ($settings as $setting) {
            $winnerUserIds = [];
            foreach (['judge_encik_winners', 'judge_puan_winners'] as $field) {
                $rows = json_decode((string) ($setting->{$field} ?? '[]'), true);
                if (! is_array($rows)) continue;
                foreach ($rows as $row) {
                    $participantId = is_array($row) ? (string) ($row['participantId'] ?? '') : '';
                    if (preg_match('/(\d+)$/', $participantId, $matches)) $winnerUserIds[] = (int) $matches[1];
                }
            }
            $winnerUserIds = array_values(array_unique(array_filter($winnerUserIds)));
            $now = now();

            DB::table('participant_registrations')
                ->where('edition_id', $setting->edition_id)
                ->where('selection_status', 'Winner')
                ->when($winnerUserIds, fn ($query) => $query->whereNotIn('user_id', $winnerUserIds))
                ->update([
                    'selection_status' => 'GrandFinal',
                    'selection_status_note' => 'Finalis Grand Final (bukan penerima gelar juara).',
                    'selection_status_updated_at' => $now,
                    'updated_at' => $now,
                ]);

            if ($winnerUserIds) {
                DB::table('participant_registrations')
                    ->where('edition_id', $setting->edition_id)
                    ->whereIn('user_id', $winnerUserIds)
                    ->update([
                        'selection_status' => 'Winner',
                        'selection_status_note' => 'Ditetapkan sebagai juara melalui menu Juara Versi Juri.',
                        'selection_status_updated_at' => $now,
                        'updated_at' => $now,
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Koreksi data tidak dibalik karena akan menghidupkan kembali status Winner yang keliru.
    }
};
