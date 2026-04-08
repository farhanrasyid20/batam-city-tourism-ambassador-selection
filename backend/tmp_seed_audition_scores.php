<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\JudgeScore;
use App\Models\ParticipantProfile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

$stage = 'Audition';
$scoreType = 'official';
$criteria = [
  'auditionAppearanceGrooming',
  'auditionConfidenceBodyLanguage',
  'auditionEthicsPersonality',
  'auditionBatamTourismKnowledge',
  'auditionMalayCultureWisdom',
  'auditionCommunicationPublicSpeaking',
  'auditionIdeaDeliveryAnswering',
  'auditionForeignLanguage',
  'auditionSupportingTalent',
  'auditionVisionMotivationCommitment',
];

$judges = User::query()
  ->where('role', 'judge')
  ->whereIn('name', ['Ardhitya', 'Sana'])
  ->orderBy('id')
  ->get(['id', 'name']);

if ($judges->count() < 2) {
  $judges = User::query()->where('role', 'judge')->orderBy('id')->limit(2)->get(['id','name']);
}

if ($judges->count() < 2) {
  echo "ERROR: butuh minimal 2 akun juri.\n";
  exit(1);
}

$excludeNames = ['Ardhitya Danur Siswondo', 'Baek Song Min'];
$profiles = ParticipantProfile::query()
  ->with('user:id,name')
  ->whereHas('user', function ($q) use ($excludeNames) {
    $q->whereNotIn('name', $excludeNames);
  })
  ->orderBy('id')
  ->get();

$seeded = 0;
$detailRows = 0;
$now = Carbon::now();

DB::transaction(function () use ($profiles, $judges, $stage, $scoreType, $criteria, $now, &$seeded, &$detailRows) {
  foreach ($profiles as $profile) {
    $participantId = 'P_API_' . $profile->user_id;
    $participantName = $profile->user?->name ?? ($profile->nickname ?: 'Peserta');

    // Pastikan semua kembali di fase audisi supaya bisa dihitung untuk lanjut tahap selanjutnya.
    $profile->selection_status = 'Audition';
    $profile->selection_status_note = 'Masuk fase audisi untuk penilaian juri (seed).';
    $profile->eliminated_in_audition = false;
    $profile->eliminated_at = null;
    $profile->selection_status_updated_at = $now;
    $profile->save();

    foreach ($judges as $judge) {
      $scoreMap = [];
      foreach ($criteria as $key) {
        $scoreMap[$key] = random_int(60, 95);
      }

      $total = round(array_sum($scoreMap) / count($scoreMap), 2);

      $record = JudgeScore::query()->updateOrCreate(
        [
          'participant_id' => $participantId,
          'judge_user_id' => (int) $judge->id,
          'stage' => $stage,
          'score_type' => $scoreType,
        ],
        [
          'participant_name' => $participantName,
          'score' => $scoreMap,
          'total_score' => $total,
          'note' => 'Seed nilai acak 2 juri (audisi).',
          'submitted_at' => $now,
        ]
      );

      $record->details()->delete();
      $insert = [];
      foreach ($criteria as $key) {
        $value = (float) $scoreMap[$key];
        $weighted = round(($value * 10) / 100, 2);
        $insert[] = [
          'judge_score_id' => (int) $record->id,
          'participant_id' => $participantId,
          'judge_user_id' => (int) $judge->id,
          'stage' => $stage,
          'score_type' => $scoreType,
          'criterion_key' => $key,
          'criterion_weight' => 10,
          'criterion_value' => $value,
          'weighted_value' => $weighted,
          'submitted_at' => $now,
          'created_at' => $now,
          'updated_at' => $now,
        ];
      }

      if (!empty($insert)) {
        $record->details()->insert($insert);
        $detailRows += count($insert);
      }

      $seeded++;
    }
  }
});

echo "Juri dipakai: " . $judges->pluck('name')->join(', ') . "\n";
echo "Peserta diproses: " . $profiles->count() . "\n";
echo "Record nilai audition diinsert/update: {$seeded}\n";
echo "Detail kriteria diinsert: {$detailRows}\n";
