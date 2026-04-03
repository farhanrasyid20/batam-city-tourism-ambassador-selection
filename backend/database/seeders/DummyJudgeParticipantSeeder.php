<?php

namespace Database\Seeders;

use App\Models\JudgeScore;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DummyJudgeParticipantSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $judgeA = User::query()->updateOrCreate(
            ['email' => 'juri.a@dummy.local'],
            [
                'name' => 'Juri Dummy A',
                'phone' => '081210000001',
                'password' => 'Password123!',
                'role' => 'judge',
                'account_status' => 'active',
                'judge_assigned_stages' => ['Audition', 'Camp', 'Grand Final'],
                'judge_title' => 'Dewan Juri',
                'judge_organization' => 'Panitia Dummy',
                'email_verified_at' => $now,
            ]
        );

        $judgeB = User::query()->updateOrCreate(
            ['email' => 'juri.b@dummy.local'],
            [
                'name' => 'Juri Dummy B',
                'phone' => '081210000002',
                'password' => 'Password123!',
                'role' => 'judge',
                'account_status' => 'active',
                'judge_assigned_stages' => ['Audition', 'Camp', 'Grand Final'],
                'judge_title' => 'Dewan Juri',
                'judge_organization' => 'Panitia Dummy',
                'email_verified_at' => $now,
            ]
        );

        $participants = [
            ['name' => 'Encik Andra', 'gender' => 'Encik', 'selection_status' => 'Audition', 'code' => 'ECK-001'],
            ['name' => 'Puan Dinda', 'gender' => 'Puan', 'selection_status' => 'Audition', 'code' => 'PUA-001'],
            ['name' => 'Encik Bima', 'gender' => 'Encik', 'selection_status' => 'PreCamp', 'code' => 'ECK-003'],
            ['name' => 'Puan Citra', 'gender' => 'Puan', 'selection_status' => 'PreCamp', 'code' => 'PUA-003'],
            ['name' => 'Encik Farhan', 'gender' => 'Encik', 'selection_status' => 'Camp', 'code' => 'ECK-005'],
            ['name' => 'Puan Gita', 'gender' => 'Puan', 'selection_status' => 'Camp', 'code' => 'PUA-005'],
            ['name' => 'Encik Hendra', 'gender' => 'Encik', 'selection_status' => 'GrandFinal', 'code' => 'ECK-007'],
            ['name' => 'Puan Intan', 'gender' => 'Puan', 'selection_status' => 'GrandFinal', 'code' => 'PUA-007'],
        ];

        foreach ($participants as $index => $item) {
            $email = 'peserta'.($index + 1).'@dummy.local';
            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => $item['name'],
                    'phone' => '0812200000'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                    'password' => 'Password123!',
                    'role' => 'participant',
                    'account_status' => 'active',
                    'email_verified_at' => $now,
                ]
            );

            ParticipantProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'participant_number' => 'AUD-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'audition_number' => 'AUD-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'participant_code' => $item['code'],
                    'gender' => $item['gender'],
                    'height_cm' => 165 + $index,
                    'education_category' => 'Kuliah',
                    'education_institution' => 'Universitas Dummy Batam',
                    'education_major' => 'Pariwisata',
                    'selection_status' => $item['selection_status'],
                    'selection_status_updated_at' => $now,
                    'submitted_to_admin' => true,
                    'submitted_to_admin_at' => $now,
                ]
            );
        }

        // Nilai dummy opsional: aktifkan dengan DUMMY_WITH_SCORES=true di .env bila memang diperlukan.
        $seedScores = strtolower((string) env('DUMMY_WITH_SCORES', 'false')) === 'true';
        if (! $seedScores) {
            return;
        }

        $campParticipants = User::query()
            ->where('role', 'participant')
            ->whereIn('email', ['peserta5@dummy.local', 'peserta6@dummy.local', 'peserta7@dummy.local', 'peserta8@dummy.local'])
            ->get();

        foreach ($campParticipants as $participant) {
            JudgeScore::query()->updateOrCreate(
                [
                    'participant_id' => 'P_API_'.$participant->id,
                    'judge_user_id' => $judgeA->id,
                    'stage' => 'Camp',
                    'score_type' => 'official',
                ],
                [
                    'participant_name' => $participant->name,
                    'score' => [
                        'campDisciplinePunctuality' => 88,
                        'campAttitudeEthics' => 89,
                        'campTeamwork' => 90,
                        'campActivenessInitiative' => 87,
                        'campTaskResponsibility' => 88,
                    ],
                    'total_score' => 88.4,
                    'submitted_at' => $now->copy()->subDays(2),
                ]
            );

            JudgeScore::query()->updateOrCreate(
                [
                    'participant_id' => 'P_API_'.$participant->id,
                    'judge_user_id' => $judgeB->id,
                    'stage' => 'Camp',
                    'score_type' => 'official',
                ],
                [
                    'participant_name' => $participant->name,
                    'score' => [
                        'campDisciplinePunctuality' => 86,
                        'campAttitudeEthics' => 88,
                        'campTeamwork' => 87,
                        'campActivenessInitiative' => 89,
                        'campTaskResponsibility' => 88,
                    ],
                    'total_score' => 87.6,
                    'submitted_at' => $now->copy()->subDays(2),
                ]
            );
        }
    }
}
