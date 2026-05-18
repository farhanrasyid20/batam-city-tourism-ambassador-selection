<?php

$sourcePath = 'C:\\Users\\User\\Downloads\\FORM PENDAFTARAN ENCIK PUAN KOTA BATAM 2026 (Jawaban) - Form Responses 1.csv';
$targetPath = __DIR__.'/../templates/participants_google_clean.csv';

function normalizeValue(mixed $value): ?string
{
    if (! is_string($value)) {
        return null;
    }

    $trimmed = trim($value);

    return $trimmed === '' ? null : $trimmed;
}

function normalizeName(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    return preg_replace('/\s+\(\d+\)$/', '', trim($value)) ?: null;
}

function normalizeGender(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    return match (strtolower(trim($value))) {
        'laki-laki', 'laki laki', 'male', 'm' => 'Encik',
        'perempuan', 'wanita', 'female', 'f' => 'Puan',
        default => trim($value),
    };
}

function normalizeYesNo(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    return match (strtolower(trim($value))) {
        'ya', 'iya', 'yes', 'y' => 'Ya',
        'tidak', 'no', 'n' => 'Tidak',
        default => trim($value),
    };
}

function parseHeight(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    if (preg_match('/(\d{2,3})/', $value, $matches)) {
        return $matches[1];
    }

    return null;
}

function extractInstagramUrl(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    $trimmed = trim($value);
    if ($trimmed === '') {
        return null;
    }

    if (preg_match('~https?://(?:www\.)?instagram\.com/([A-Za-z0-9._]+)~i', $trimmed, $matches)) {
        return 'https://instagram.com/'.$matches[1];
    }

    $patterns = [
        '/instagram\s*[:=;\-]?\s*@?([A-Za-z0-9._]+)/i',
        '/\big\s*[:=;\-]?\s*@?([A-Za-z0-9._]+)/i',
        '/@?([A-Za-z0-9._]+)\s*\(instagram\)/i',
    ];

    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $trimmed, $matches)) {
            return 'https://instagram.com/'.ltrim($matches[1], '@');
        }
    }

    $withoutTiktok = preg_replace('/tiktok\s*[:=;\-]?\s*@?[A-Za-z0-9._]+/i', ' ', $trimmed);
    $withoutTiktok = preg_replace('/tt\s*[:=;\-]?\s*@?[A-Za-z0-9._]+/i', ' ', (string) $withoutTiktok);

    if (preg_match('/@([A-Za-z0-9._]+)/', (string) $withoutTiktok, $matches)) {
        return 'https://instagram.com/'.$matches[1];
    }

    if (preg_match('/\b([A-Za-z0-9._]{3,})\b/', (string) $withoutTiktok, $matches)) {
        $candidate = $matches[1];
        if (! in_array(strtolower($candidate), ['instagram', 'tiktok', 'ig', 'tt', 'dan'], true)) {
            return 'https://instagram.com/'.$candidate;
        }
    }

    return null;
}

$handle = fopen($sourcePath, 'rb');
if ($handle === false) {
    fwrite(STDERR, "Tidak bisa membuka source CSV: {$sourcePath}\n");
    exit(1);
}

$header = fgetcsv($handle);
if (! is_array($header) || $header === []) {
    fclose($handle);
    fwrite(STDERR, "Header source CSV kosong.\n");
    exit(1);
}

$header = array_map(
    static fn ($value): string => strtolower(trim((string) $value)),
    $header
);

$rows = [];
while (($row = fgetcsv($handle)) !== false) {
    $row = array_pad($row, count($header), null);
    $assoc = [];
    foreach ($header as $index => $key) {
        $assoc[$key] = normalizeValue($row[$index] ?? null);
    }
    $rows[] = $assoc;
}
fclose($handle);

$rows = array_values(array_slice($rows, 3));

$records = [];
$seenEmails = [];
foreach ($rows as $row) {
    $email = strtolower(trim((string) ($row['email address'] ?? '')));
    $name = normalizeName($row['nama lengkap'] ?? null);

    if ($email === '' || $name === null || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        continue;
    }

    if (isset($seenEmails[$email])) {
        continue;
    }

    $seenEmails[$email] = true;

    $records[] = [
        'name' => $name,
        'email' => $email,
        'phone' => $row['nomor whatsapp'] ?? null,
        'gender' => normalizeGender($row['jenis kelamin'] ?? null),
        'participant_number' => null,
        'audition_number' => null,
        'participant_code' => null,
        'nickname' => $row['nama panggilan'] ?? null,
        'religion' => null,
        'national_id' => null,
        'current_status' => null,
        'birth_place' => $row['tempat lahir'] ?? null,
        'birth_date' => $row['tanggal lahir'] ?? null,
        'domicile_address' => $row['alamat domisili'] ?? null,
        'ktp_address' => $row['alamat sesuai ktp'] ?? null,
        'instagram' => extractInstagramUrl($row['media sosial (instagram/tiktok)'] ?? null),
        'tiktok' => null,
        'parent_phone' => $row['nomor hp orang tua/wali'] ?? null,
        'father_name' => null,
        'mother_name' => null,
        'photo' => null,
        'height_cm' => parseHeight($row['tinggi badan (cm)'] ?? null),
        'weight_kg' => $row['berat badan (kg)'] ?? null,
        'shirt_size' => $row['ukuran baju'] ?? null,
        'chest_circumference_cm' => $row['lingkar dada (cm)'] ?? null,
        'waist_circumference_cm' => $row['lingkar pinggang (cm)'] ?? null,
        'hip_circumference_cm' => $row['lingkar pinggul (cm)'] ?? null,
        'pants_size' => $row['ukuran celana'] ?? null,
        'shoe_size' => $row['ukuran sepatu'] ?? null,
        'education_category' => $row['pendidikan'] ?? null,
        'education_institution' => $row['nama sekolah/universitas/kantor'] ?? null,
        'education_major' => null,
        'education_degree' => null,
        'occupation' => $row['pekerjaan'] ?? null,
        'skills' => $row['keahlian/bakat'] ?? null,
        'hobbies' => $row['hobi'] ?? null,
        'languages' => $row['bahasa yang dikuasai'] ?? null,
        'vision' => null,
        'mission' => null,
        'experience' => $row['2. apakah anda pernah mengikuti ajang seperti public speaking competition, pemilihan duta, dan modelling (fashion show, foto model, model iklan) dan sebagainya?'] ?? null,
        'achievement' => $row['prestasi'] ?? null,
        'agreement_no_agency' => normalizeYesNo($row['1. apakah saat ini anda sedang terikat kontrak atau perjanjian secara lisan maupun tulisan dengan agensi model?'] ?? null),
        'agency_name' => $row['jika jawaban anda di atas (ya), sebutkan nama agensi tersebut.'] ?? null,
        'agreement_parent_permission' => normalizeYesNo($row['3. apabila anda berhasil menjadi kandidat encik puan kota batam apakah anda bersedia dan mendapat izin dari orang tua/wali/sekolah/universitas/kantor untuk mengikuti rangkaian pra karantina, karantina dan grand final?'] ?? null),
        'agreement_all_stages' => normalizeYesNo($row['4. apabila anda berhasil finalis maupun juara pada pemilihan encik puan kota batam, apakah anda bersedia untuk mengikuti berbagai kegiatan berskala lokal, nasional, maupun internasional?'] ?? null),
        'motivation_statement' => null,
        'contribution_idea' => null,
        'public_speaking_experience' => $row['2. apakah anda pernah mengikuti ajang seperti public speaking competition, pemilihan duta, dan modelling (fashion show, foto model, model iklan) dan sebagainya?'] ?? null,
        'selection_status' => null,
        'selection_status_note' => null,
    ];
}

$targetHandle = fopen($targetPath, 'wb');
if ($targetHandle === false) {
    fwrite(STDERR, "Tidak bisa menulis target CSV: {$targetPath}\n");
    exit(1);
}

if ($records === []) {
    fclose($targetHandle);
    fwrite(STDERR, "Tidak ada record yang berhasil dinormalisasi.\n");
    exit(1);
}

fputcsv($targetHandle, array_keys($records[0]));
foreach ($records as $record) {
    fputcsv($targetHandle, $record);
}
fclose($targetHandle);

fwrite(STDOUT, "Berhasil membuat CSV bersih: {$targetPath}\n");
fwrite(STDOUT, 'Jumlah record: '.count($records)."\n");
