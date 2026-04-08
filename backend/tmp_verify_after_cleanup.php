<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$total = DB::table('judge_scores')->where('stage','Audition')->where('score_type','official')->distinct('participant_id')->count('participant_id');
echo "participants_with_audition_official={$total}\n";

$check = DB::table('judge_scores')->where('stage','Audition')->where('score_type','official')->whereIn('participant_id',['P_API_14','P_API_27'])->count();
echo "rows_for_ardhitya_baek={$check}\n";

$top = DB::table('judge_scores')
  ->select('participant_id','participant_name', DB::raw('ROUND(AVG(total_score),2) as avg_score'), DB::raw('COUNT(*) as judges'))
  ->where('stage','Audition')
  ->where('score_type','official')
  ->groupBy('participant_id','participant_name')
  ->orderByDesc('avg_score')
  ->limit(5)
  ->get();
foreach($top as $r){
  echo "{$r->participant_name}|{$r->avg_score}|juri={$r->judges}\n";
}
