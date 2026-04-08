<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$targets = ['P_API_14','P_API_27'];
$scoreIds = DB::table('judge_scores')
  ->whereIn('participant_id', $targets)
  ->where('stage', 'Audition')
  ->where('score_type', 'official')
  ->pluck('id');

$detailDeleted = 0;
if ($scoreIds->isNotEmpty()) {
  $detailDeleted = DB::table('judge_score_details')->whereIn('judge_score_id', $scoreIds)->delete();
}
$scoreDeleted = DB::table('judge_scores')
  ->whereIn('participant_id', $targets)
  ->where('stage', 'Audition')
  ->where('score_type', 'official')
  ->delete();

echo "detail_deleted={$detailDeleted}\n";
echo "score_deleted={$scoreDeleted}\n";
