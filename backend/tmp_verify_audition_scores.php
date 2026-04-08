<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$rows = DB::table('judge_scores')
  ->selectRaw('participant_id, COUNT(DISTINCT judge_user_id) as judge_count, ROUND(AVG(total_score),2) as avg_score')
  ->where('stage', 'Audition')
  ->where('score_type', 'official')
  ->groupBy('participant_id')
  ->orderByDesc('avg_score')
  ->get();

echo 'Total peserta punya nilai audisi official: ' . $rows->count() . PHP_EOL;

$top = $rows->take(25);
foreach ($top as $r) {
  echo $r->participant_id . '|juri:' . $r->judge_count . '|avg:' . $r->avg_score . PHP_EOL;
}
