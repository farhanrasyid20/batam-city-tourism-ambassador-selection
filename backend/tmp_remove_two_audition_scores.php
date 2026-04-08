<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\JudgeScore;
use Illuminate\Support\Facades\DB;

$exclude = ['P_API_14', 'P_API_27'];
$ids = JudgeScore::query()
  ->where('stage', 'Audition')
  ->where('score_type', 'official')
  ->whereIn('participant_id', $exclude)
  ->pluck('id');

if ($ids->count()) {
  DB::table('judge_score_details')->whereIn('judge_score_id', $ids)->delete();
  JudgeScore::query()->whereIn('id', $ids)->delete();
}

echo 'Deleted score rows: ' . $ids->count() . PHP_EOL;
