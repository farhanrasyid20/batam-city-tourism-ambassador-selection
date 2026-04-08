<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$judges = App\Models\User::where('role', 'judge')->orderBy('id')->get(['id','name','email']);
foreach ($judges as $j) {
  echo $j->id . '|' . $j->name . '|' . $j->email . PHP_EOL;
}

echo "---" . PHP_EOL;
$profiles = App\Models\ParticipantProfile::with('user:id,name,email')->orderBy('id')->get();
foreach ($profiles as $p) {
  $name = $p->user?->name ?? '-';
  echo $p->id . '|' . ($p->participant_code ?? '-') . '|' . ($p->audition_number ?? '-') . '|' . ($p->gender ?? '-') . '|' . $name . PHP_EOL;
}
