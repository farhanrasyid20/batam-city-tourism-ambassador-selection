<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command(
    'participants:import-csv
    {path : Path file CSV, bisa relatif dari folder backend atau absolute path}
    {--default-password=Peserta123! : Password default untuk semua akun peserta baru}
    {--account-status=active : Status akun user participant}
    {--submitted=0 : 1 = tandai sudah submit ke admin, 0 = belum}
    {--verified-email=1 : 1 = isi email_verified_at, 0 = biarkan null}
    {--skip-first=0 : Lewati N baris data pertama setelah header}
    {--dedupe=none : Mode dedupe email: none, first, last}
    {--source=template : Sumber CSV: template atau google-form}
    {--generate-audition=0 : 1 = generate AUD-001 dst sesuai urutan data final}
    {--default-selection-status=Pending : Status seleksi default saat kolom tidak tersedia}
    {--preserve-workflow=0 : 1 = pertahankan nomor audisi, status seleksi, dan flag submit yang sudah ada}',
    function (): int {
        $pathOption = (string) $this->argument('path');
        $defaultPassword = (string) $this->option('default-password');
        $accountStatus = (string) $this->option('account-status');
        $markSubmitted = filter_var($this->option('submitted'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        $markVerifiedEmail = filter_var($this->option('verified-email'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        $skipFirst = max(0, (int) $this->option('skip-first'));
        $dedupeMode = strtolower(trim((string) $this->option('dedupe')));
        $source = strtolower(trim((string) $this->option('source')));
        $generateAudition = filter_var($this->option('generate-audition'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        $defaultSelectionStatus = trim((string) $this->option('default-selection-status'));
        $preserveWorkflow = filter_var($this->option('preserve-workflow'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);

        $markSubmitted ??= in_array((string) $this->option('submitted'), ['1', 'yes', 'true'], true);
        $markVerifiedEmail ??= in_array((string) $this->option('verified-email'), ['1', 'yes', 'true'], true);
        $generateAudition ??= in_array((string) $this->option('generate-audition'), ['1', 'yes', 'true'], true);
        $preserveWorkflow ??= in_array((string) $this->option('preserve-workflow'), ['1', 'yes', 'true'], true);

        if (! in_array($dedupeMode, ['none', 'first', 'last'], true)) {
            $this->error('Nilai --dedupe harus salah satu dari: none, first, last.');

            return self::FAILURE;
        }

        if (! in_array($source, ['template', 'google-form'], true)) {
            $this->error('Nilai --source harus salah satu dari: template, google-form.');

            return self::FAILURE;
        }

        $csvPath = $pathOption;
        if (! str_starts_with($csvPath, DIRECTORY_SEPARATOR)
            && ! preg_match('/^[A-Za-z]:\\\\/', $csvPath)
        ) {
            $csvPath = base_path($csvPath);
        }

        if (! is_file($csvPath)) {
            $this->error("File CSV tidak ditemukan: {$csvPath}");

            return self::FAILURE;
        }

        $handle = fopen($csvPath, 'rb');
        if ($handle === false) {
            $this->error("File CSV tidak bisa dibuka: {$csvPath}");

            return self::FAILURE;
        }

        $header = fgetcsv($handle);
        if (! is_array($header) || $header === []) {
            fclose($handle);
            $this->error('Header CSV kosong atau tidak valid.');

            return self::FAILURE;
        }

        $normalizeHeader = static function ($value): string {
            $value = is_string($value) ? trim($value) : '';

            return strtolower($value);
        };

        $headers = array_map($normalizeHeader, $header);
        $requiredHeaders = $source === 'google-form'
            ? ['email address', 'nama lengkap']
            : ['name', 'email'];
        foreach ($requiredHeaders as $requiredHeader) {
            if (! in_array($requiredHeader, $headers, true)) {
                fclose($handle);
                $this->error("Header wajib `{$requiredHeader}` tidak ditemukan.");

                return self::FAILURE;
            }
        }

        $normalizeValue = static function ($value) {
            if (! is_string($value)) {
                return $value;
            }

            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }

            if (strtolower($trimmed) === 'null') {
                return null;
            }

            return $trimmed;
        };

        $parseDate = static function ($value): ?string {
            if (! is_string($value)) {
                return null;
            }

            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }

            $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y'];
            foreach ($formats as $format) {
                $date = \DateTime::createFromFormat($format, $trimmed);
                if ($date !== false) {
                    return $date->format('Y-m-d');
                }
            }

            try {
                return (new \DateTime($trimmed))->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        };

        $normalizeName = static function (?string $value): ?string {
            if ($value === null) {
                return null;
            }

            return preg_replace('/\s+\(\d+\)$/', '', trim($value)) ?: null;
        };

        $normalizeGender = static function (?string $value): ?string {
            if ($value === null) {
                return null;
            }

            $normalized = strtolower(trim($value));

            return match ($normalized) {
                'laki-laki', 'laki laki', 'male', 'm' => 'Encik',
                'perempuan', 'wanita', 'female', 'f' => 'Puan',
                'encik' => 'Encik',
                'puan' => 'Puan',
                default => trim($value),
            };
        };

        $normalizeTextBool = static function (?string $value): ?string {
            if ($value === null) {
                return null;
            }

            $normalized = strtolower(trim($value));

            return match ($normalized) {
                'ya', 'iya', 'yes', 'y' => 'Ya',
                'tidak', 'no', 'n' => 'Tidak',
                default => trim($value),
            };
        };

        $parseTimestamp = static function ($value): ?string {
            if (! is_string($value)) {
                return null;
            }

            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }

            $formats = ['d/m/Y H:i:s', 'd/m/Y G:i:s', 'Y-m-d H:i:s'];
            foreach ($formats as $format) {
                $date = \DateTime::createFromFormat($format, $trimmed);
                if ($date !== false) {
                    return $date->format('Y-m-d H:i:s');
                }
            }

            try {
                return (new \DateTime($trimmed))->format('Y-m-d H:i:s');
            } catch (\Throwable) {
                return null;
            }
        };

        $splitSocialMedia = static function (?string $value): array {
            if ($value === null) {
                return ['instagram' => null, 'tiktok' => null];
            }

            $trimmed = trim($value);
            if ($trimmed === '') {
                return ['instagram' => null, 'tiktok' => null];
            }

            if (preg_match('~https?://(?:www\.)?instagram\.com/([A-Za-z0-9._]+)~i', $trimmed, $matches)) {
                return [
                    'instagram' => 'https://instagram.com/'.$matches[1],
                    'tiktok' => null,
                ];
            }

            $patterns = [
                '/instagram\s*[:=-]?\s*@?([A-Za-z0-9._]+)/i',
                '/\big\s*[:=-]?\s*@?([A-Za-z0-9._]+)/i',
                '/@?([A-Za-z0-9._]+)\s*\(instagram\)/i',
            ];

            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $trimmed, $matches)) {
                    return [
                        'instagram' => 'https://instagram.com/'.ltrim($matches[1], '@'),
                        'tiktok' => null,
                    ];
                }
            }

            $withoutTiktok = preg_replace('/tiktok\s*[:=-]?\s*@?[A-Za-z0-9._]+/i', ' ', $trimmed);
            $withoutTiktok = preg_replace('/tt\s*[:=-]?\s*@?[A-Za-z0-9._]+/i', ' ', (string) $withoutTiktok);

            if (preg_match('/@([A-Za-z0-9._]+)/', (string) $withoutTiktok, $matches)) {
                return [
                    'instagram' => 'https://instagram.com/'.$matches[1],
                    'tiktok' => null,
                ];
            }

            if (preg_match('/\b([A-Za-z0-9._]{3,})\b/', (string) $withoutTiktok, $matches)) {
                $candidate = $matches[1];
                if (! in_array(strtolower($candidate), ['instagram', 'tiktok', 'ig', 'tt', 'dan'], true)) {
                    return [
                        'instagram' => 'https://instagram.com/'.$candidate,
                        'tiktok' => null,
                    ];
                }
            }

            return ['instagram' => null, 'tiktok' => null];
        };

        $parseHeight = static function ($value): ?int {
            if ($value === null) {
                return null;
            }

            $trimmed = trim((string) $value);
            if ($trimmed === '') {
                return null;
            }

            if (preg_match('/(\d{2,3})/', $trimmed, $matches)) {
                return (int) $matches[1];
            }

            return null;
        };

        $limitValue = static function ($value, int $maxLength): ?string {
            if ($value === null) {
                return null;
            }

            $stringValue = trim((string) $value);
            if ($stringValue === '') {
                return null;
            }

            if (mb_strlen($stringValue) <= $maxLength) {
                return $stringValue;
            }

            return mb_substr($stringValue, 0, $maxLength);
        };

        $mapGoogleFormRecord = static function (array $record) use (
            $normalizeName,
            $normalizeGender,
            $normalizeTextBool,
            $splitSocialMedia,
            $parseHeight
        ): array {
            $socialMedia = $splitSocialMedia($record['media sosial (instagram/tiktok)'] ?? null);

            return [
                'source_timestamp' => $record['timestamp'] ?? null,
                'name' => $normalizeName($record['nama lengkap'] ?? null),
                'email' => isset($record['email address']) ? strtolower((string) $record['email address']) : null,
                'phone' => $record['nomor whatsapp'] ?? null,
                'gender' => $normalizeGender($record['jenis kelamin'] ?? null),
                'nickname' => $record['nama panggilan'] ?? null,
                'birth_place' => $record['tempat lahir'] ?? null,
                'birth_date' => $record['tanggal lahir'] ?? null,
                'domicile_address' => $record['alamat domisili'] ?? null,
                'ktp_address' => $record['alamat sesuai ktp'] ?? null,
                'parent_phone' => $record['nomor hp orang tua/wali'] ?? null,
                'instagram' => $socialMedia['instagram'],
                'tiktok' => $socialMedia['tiktok'],
                'education_category' => $record['pendidikan'] ?? null,
                'education_institution' => $record['nama sekolah/universitas/kantor'] ?? null,
                'occupation' => $record['pekerjaan'] ?? null,
                'skills' => $record['keahlian/bakat'] ?? null,
                'hobbies' => $record['hobi'] ?? null,
                'languages' => $record['bahasa yang dikuasai'] ?? null,
                'height_cm' => $parseHeight($record['tinggi badan (cm)'] ?? null),
                'weight_kg' => $record['berat badan (kg)'] ?? null,
                'shirt_size' => $record['ukuran baju'] ?? null,
                'chest_circumference_cm' => $record['lingkar dada (cm)'] ?? null,
                'waist_circumference_cm' => $record['lingkar pinggang (cm)'] ?? null,
                'hip_circumference_cm' => $record['lingkar pinggul (cm)'] ?? null,
                'pants_size' => $record['ukuran celana'] ?? null,
                'shoe_size' => $record['ukuran sepatu'] ?? null,
                'agreement_no_agency' => $normalizeTextBool($record['1. apakah saat ini anda sedang terikat kontrak atau perjanjian secara lisan maupun tulisan dengan agensi model?'] ?? null),
                'agency_name' => $record['jika jawaban anda di atas (ya), sebutkan nama agensi tersebut.'] ?? null,
                'experience' => $record['2. apakah anda pernah mengikuti ajang seperti public speaking competition, pemilihan duta, dan modelling (fashion show, foto model, model iklan) dan sebagainya?'] ?? null,
                'public_speaking_experience' => $record['2. apakah anda pernah mengikuti ajang seperti public speaking competition, pemilihan duta, dan modelling (fashion show, foto model, model iklan) dan sebagainya?'] ?? null,
                'agreement_parent_permission' => $normalizeTextBool($record['3. apabila anda berhasil menjadi kandidat encik puan kota batam apakah anda bersedia dan mendapat izin dari orang tua/wali/sekolah/universitas/kantor untuk mengikuti rangkaian pra karantina, karantina dan grand final?'] ?? null),
                'agreement_all_stages' => $normalizeTextBool($record['4. apabila anda berhasil finalis maupun juara pada pemilihan encik puan kota batam, apakah anda bersedia untuk mengikuti berbagai kegiatan berskala lokal, nasional, maupun internasional?'] ?? null),
                'achievement' => $record['prestasi'] ?? null,
                'selection_status' => null,
                'selection_status_note' => null,
            ];
        };

        $rawRecords = [];
        $physicalRowNumber = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $physicalRowNumber++;

            if ($row === [null] || $row === []) {
                continue;
            }

            $row = array_pad($row, count($headers), null);
            $record = ['_row_number' => $physicalRowNumber];
            foreach ($headers as $index => $headerName) {
                $record[$headerName] = $normalizeValue($row[$index] ?? null);
            }

            $rawRecords[] = $record;
        }

        fclose($handle);

        if ($skipFirst > 0) {
            $rawRecords = array_values(array_slice($rawRecords, $skipFirst));
        }

        $preparedRecords = [];
        $skippedCount = 0;
        $warningMessages = [];
        $seenEmails = [];

        foreach ($rawRecords as $record) {
            $prepared = $source === 'google-form'
                ? $mapGoogleFormRecord($record)
                : $record;

            $name = isset($prepared['name']) ? $normalizeName((string) $prepared['name']) : null;
            $email = isset($prepared['email']) ? strtolower(trim((string) $prepared['email'])) : null;

            if ($name === null || $email === null) {
                $skippedCount++;
                $warningMessages[] = "Baris {$record['_row_number']} dilewati karena `name` atau `email` kosong.";
                continue;
            }

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skippedCount++;
                $warningMessages[] = "Baris {$record['_row_number']} dilewati karena email tidak valid: {$email}";
                continue;
            }

            if ($dedupeMode !== 'none') {
                if ($dedupeMode === 'first' && array_key_exists($email, $seenEmails)) {
                    $skippedCount++;
                    $warningMessages[] = "Baris {$record['_row_number']} dilewati karena email duplikat dan mode dedupe `first`: {$email}";
                    continue;
                }

                if ($dedupeMode === 'last' && array_key_exists($email, $seenEmails)) {
                    unset($preparedRecords[$seenEmails[$email]]);
                }
            }

            $prepared['name'] = $name;
            $prepared['email'] = $email;
            $prepared['gender'] = $normalizeGender($prepared['gender'] ?? null);
            $prepared['_row_number'] = $record['_row_number'];
            $prepared['_source_timestamp'] = $prepared['source_timestamp'] ?? null;
            $preparedRecords[] = $prepared;
            $seenEmails[$email] = array_key_last($preparedRecords);
        }

        $createdCount = 0;
        $updatedCount = 0;
        $sequence = 1;

        foreach ($preparedRecords as $record) {
            $birthDate = $parseDate($record['birth_date'] ?? null);
            if (($record['birth_date'] ?? null) !== null && $birthDate === null) {
                $warningMessages[] = "Baris {$record['_row_number']}: `birth_date` tidak terbaca, dikosongkan.";
            }

            $rowTimestamp = $parseTimestamp($record['_source_timestamp'] ?? null);
            $rowNow = $rowTimestamp ?? now()->format('Y-m-d H:i:s');
            $auditionNumber = null;

            if ($generateAudition) {
                $auditionNumber = 'AUD-'.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
                $sequence++;
            }

            DB::transaction(function () use (
                $record,
                $defaultPassword,
                $accountStatus,
                $markSubmitted,
                $markVerifiedEmail,
                $defaultSelectionStatus,
                $preserveWorkflow,
                $birthDate,
                $rowNow,
                $auditionNumber,
                $limitValue,
                &$createdCount,
                &$updatedCount
            ): void {
                $existingUser = DB::table('users')->where('email', $record['email'])->first();

                $userPayload = [
                    'name' => $record['name'],
                    'email' => $record['email'],
                    'phone' => $limitValue($record['phone'] ?? null, 30),
                    'role' => 'participant',
                    'account_status' => $accountStatus,
                    'updated_at' => $rowNow,
                ];

                if ($existingUser === null) {
                    $userPayload['password'] = Hash::make($defaultPassword);
                    $userPayload['email_verified_at'] = $markVerifiedEmail ? $rowNow : null;
                    $userPayload['created_at'] = $rowNow;

                    $userId = DB::table('users')->insertGetId($userPayload);
                    $createdCount++;
                } else {
                    if ($markVerifiedEmail && $existingUser->email_verified_at === null) {
                        $userPayload['email_verified_at'] = $rowNow;
                    }

                    DB::table('users')->where('id', $existingUser->id)->update($userPayload);
                    $userId = (int) $existingUser->id;
                    $updatedCount++;
                }

                $existingProfile = DB::table('participant_profiles')->where('user_id', $userId)->first();
                $selectionStatus = $record['selection_status'] ?? null;
                if ($selectionStatus === null && $defaultSelectionStatus !== '') {
                    $selectionStatus = $defaultSelectionStatus;
                }

                $submittedAt = $markSubmitted ? $rowNow : null;
                $participantNumber = $record['participant_number'] ?? $auditionNumber;
                $auditionValue = $record['audition_number'] ?? $auditionNumber;
                $participantCode = $limitValue($record['participant_code'] ?? null, 40);
                $submittedFlag = $markSubmitted ? 1 : 0;
                $selectionStatusValue = $limitValue($selectionStatus, 30);
                $selectionStatusNote = $record['selection_status_note'] ?? null;
                $selectionStatusUpdatedAt = $selectionStatus !== null ? $rowNow : null;

                if ($preserveWorkflow && $existingProfile !== null) {
                    $participantNumber = $existingProfile->participant_number;
                    $auditionValue = $existingProfile->audition_number;
                    $participantCode = $existingProfile->participant_code;
                    $submittedFlag = (int) $existingProfile->submitted_to_admin;
                    $submittedAt = $existingProfile->submitted_to_admin_at;
                    $selectionStatusValue = $existingProfile->selection_status;
                    $selectionStatusNote = $existingProfile->selection_status_note;
                    $selectionStatusUpdatedAt = $existingProfile->selection_status_updated_at;
                }

                $profilePayload = [
                    'user_id' => $userId,
                    'participant_number' => $participantNumber,
                    'audition_number' => $auditionValue,
                    'participant_code' => $participantCode,
                    'gender' => $limitValue($record['gender'] ?? null, 20),
                    'submitted_to_admin' => $submittedFlag,
                    'submitted_to_admin_at' => $submittedAt,
                    'selection_status' => $selectionStatusValue,
                    'selection_status_note' => $selectionStatusNote,
                    'selection_status_updated_at' => $selectionStatusUpdatedAt,
                    'updated_at' => $rowNow,
                ];

                if ($existingProfile === null) {
                    $profilePayload['created_at'] = $rowNow;
                    $profileId = DB::table('participant_profiles')->insertGetId($profilePayload);
                } else {
                    DB::table('participant_profiles')->where('id', $existingProfile->id)->update($profilePayload);
                    $profileId = (int) $existingProfile->id;
                }

                DB::table('participant_profile_identities')->updateOrInsert(
                    ['participant_profile_id' => $profileId],
                    [
                        'participant_profile_id' => $profileId,
                        'nickname' => $limitValue($record['nickname'] ?? null, 120),
                        'religion' => $limitValue($record['religion'] ?? null, 80),
                        'national_id' => $limitValue($record['national_id'] ?? null, 30),
                        'current_status' => $limitValue($record['current_status'] ?? null, 50),
                        'birth_place' => $limitValue($record['birth_place'] ?? null, 120),
                        'birth_date' => $birthDate,
                        'domicile_address' => $record['domicile_address'] ?? null,
                        'ktp_address' => $record['ktp_address'] ?? null,
                        'instagram' => $limitValue($record['instagram'] ?? null, 255),
                        'tiktok' => null,
                        'parent_phone' => $limitValue($record['parent_phone'] ?? null, 40),
                        'father_name' => $limitValue($record['father_name'] ?? null, 255),
                        'mother_name' => $limitValue($record['mother_name'] ?? null, 255),
                        'photo' => $record['photo'] ?? null,
                        'created_at' => $rowNow,
                        'updated_at' => $rowNow,
                    ]
                );

                DB::table('participant_profile_measurements')->updateOrInsert(
                    ['participant_profile_id' => $profileId],
                    [
                        'participant_profile_id' => $profileId,
                        'height_cm' => $record['height_cm'] ?? null,
                        'weight_kg' => $limitValue($record['weight_kg'] ?? null, 30),
                        'shirt_size' => $limitValue($record['shirt_size'] ?? null, 30),
                        'chest_circumference_cm' => $limitValue($record['chest_circumference_cm'] ?? null, 30),
                        'waist_circumference_cm' => $limitValue($record['waist_circumference_cm'] ?? null, 30),
                        'hip_circumference_cm' => $limitValue($record['hip_circumference_cm'] ?? null, 30),
                        'pants_size' => $limitValue($record['pants_size'] ?? null, 30),
                        'shoe_size' => $limitValue($record['shoe_size'] ?? null, 30),
                        'created_at' => $rowNow,
                        'updated_at' => $rowNow,
                    ]
                );

                DB::table('participant_profile_backgrounds')->updateOrInsert(
                    ['participant_profile_id' => $profileId],
                    [
                        'participant_profile_id' => $profileId,
                        'education_category' => $limitValue($record['education_category'] ?? null, 30),
                        'education_institution' => $limitValue($record['education_institution'] ?? null, 255),
                        'education_major' => $limitValue($record['education_major'] ?? null, 255),
                        'education_degree' => $limitValue($record['education_degree'] ?? null, 30),
                        'occupation' => $limitValue($record['occupation'] ?? null, 255),
                        'skills' => $record['skills'] ?? null,
                        'hobbies' => $record['hobbies'] ?? null,
                        'languages' => $record['languages'] ?? null,
                        'created_at' => $rowNow,
                        'updated_at' => $rowNow,
                    ]
                );

                DB::table('participant_profile_statements')->updateOrInsert(
                    ['participant_profile_id' => $profileId],
                    [
                        'participant_profile_id' => $profileId,
                        'vision' => $record['vision'] ?? null,
                        'mission' => $record['mission'] ?? null,
                        'experience' => $record['experience'] ?? null,
                        'achievement' => $record['achievement'] ?? null,
                        'agreement_no_agency' => $limitValue($record['agreement_no_agency'] ?? null, 10),
                        'agency_name' => $limitValue($record['agency_name'] ?? null, 255),
                        'agreement_parent_permission' => $limitValue($record['agreement_parent_permission'] ?? null, 10),
                        'agreement_all_stages' => $limitValue($record['agreement_all_stages'] ?? null, 10),
                        'motivation_statement' => $record['motivation_statement'] ?? null,
                        'contribution_idea' => $record['contribution_idea'] ?? null,
                        'public_speaking_experience' => $record['public_speaking_experience'] ?? null,
                        'created_at' => $rowNow,
                        'updated_at' => $rowNow,
                    ]
                );
            });
        }

        $this->info('Import selesai.');
        $this->line('User baru: '.$createdCount);
        $this->line('User diupdate: '.$updatedCount);
        $this->line('Baris dilewati: '.$skippedCount);
        $this->line('Baris final terimport: '.count($preparedRecords));

        foreach ($warningMessages as $warningMessage) {
            $this->warn($warningMessage);
        }

        return self::SUCCESS;
    }
)->purpose('Import peserta massal dari file CSV ke users dan participant profile.');
