<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\DB;

$rows = DB::table('judge_scores')
  ->select('participant_id','participant_name','stage','score_type', DB::raw('COUNT(*) as c'), DB::raw('AVG(total_score) as avg_score'))
  ->whereIn('participant_id',['P_API_14','P_API_27'])
  ->groupBy('participant_id','participant_name','stage','score_type')
  ->orderBy('participant_id')->orderBy('stage')
  ->get();

echo "=== Ardhitya/Baek score rows ===\n";
foreach($rows as $r){
  echo "{$r->participant_id} | {$r->participant_name} | {$r->stage} | {$r->score_type} | c={$r->c} | avg={$r->avg_score}\n";
}

$audRows = DB::table('judge_scores')
  ->select('stage','score_type', DB::raw('COUNT(*) as c'))
  ->groupBy('stage','score_type')
  ->orderBy('stage')->orderBy('score_type')
  ->get();

echo "\n=== all stage+score_type counts ===\n";
foreach($audRows as $r){
  echo "{$r->stage} | {$r->score_type} | {$r->c}\n";
}

$top = DB::table('judge_scores')
  ->select('participant_id','participant_name', DB::raw('AVG(total_score) as avg_score'), DB::raw('COUNT(*) as c'))
  ->where('stage','Audition')
  ->groupBy('participant_id','participant_name')
  ->orderByDesc('avg_score')
  ->limit(25)
  ->get();

echo "\n=== top avg stage Audition (all score_type) ===\n";
foreach($top as $r){
  echo "{$r->participant_id} | {$r->participant_name} | avg={$r->avg_score} | c={$r->c}\n";
}
