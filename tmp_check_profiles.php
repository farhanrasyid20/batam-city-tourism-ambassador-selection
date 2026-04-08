<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\DB;

$profiles = DB::table('participant_profiles')
  ->leftJoin('users','users.id','=','participant_profiles.user_id')
  ->select('participant_profiles.id','participant_profiles.participant_code','participant_profiles.audition_number','participant_profiles.selection_status','users.name')
  ->whereIn('participant_profiles.id',[9,21])
  ->get();

echo "=== profiles id 9 and 21 ===\n";
foreach($profiles as $p){
 echo "profile={$p->id} | {$p->name} | {$p->participant_code} | {$p->audition_number} | status={$p->selection_status}\n";
}
