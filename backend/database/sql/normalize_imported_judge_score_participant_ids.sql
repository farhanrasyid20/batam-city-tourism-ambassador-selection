-- Nilai Pra Karantina, Karantina, dan Grand Final sudah lengkap.
-- participant_name pada data impor benar, sedangkan participant_id lama tidak konsisten.
-- Script ini menormalisasi seluruh nilai resmi 20 finalis ke ID akun peserta yang benar.

START TRANSACTION;

UPDATE judge_scores
SET participant_id = CASE TRIM(participant_name)
    WHEN 'Firli Farouq Al Fahri' THEN 'TMP_FINALIST_47'
    WHEN 'Charla Ranadhiya Tabitha.Z' THEN 'TMP_FINALIST_33'
    WHEN 'Muhammad Nabil Fata Anaza' THEN 'TMP_FINALIST_50'
    WHEN 'Rameyza Alya Rabbania' THEN 'TMP_FINALIST_16'
    WHEN 'Rakeyan Muhammad Braja Pamungkas' THEN 'TMP_FINALIST_41'
    WHEN 'Meysa aurelia akbar' THEN 'TMP_FINALIST_53'
    WHEN 'Harya Gilang Bagaskara' THEN 'TMP_FINALIST_86'
    WHEN 'Sabrina Putri Cantika' THEN 'TMP_FINALIST_55'
    WHEN 'Sanjit Saputra' THEN 'TMP_FINALIST_46'
    WHEN 'Kezia Hirano Danito' THEN 'TMP_FINALIST_13'
    WHEN 'Willyam Sahat Pul Sitompul' THEN 'TMP_FINALIST_91'
    WHEN 'Nayla Balqis' THEN 'TMP_FINALIST_59'
    WHEN 'Arya Syaputra' THEN 'TMP_FINALIST_62'
    WHEN 'Chelsi Annisa' THEN 'TMP_FINALIST_25'
    WHEN 'Fikri Ismail' THEN 'TMP_FINALIST_24'
    WHEN 'Jho Funny Cantika Barus' THEN 'TMP_FINALIST_32'
    WHEN 'Alfajar Madani' THEN 'TMP_FINALIST_79'
    WHEN 'Dina Hulbi Aulia' THEN 'TMP_FINALIST_45'
    WHEN 'Hadrian Ivander Kusuma' THEN 'TMP_FINALIST_93'
    WHEN 'Rebecca Theresia Nauli Rajagukguk' THEN 'TMP_FINALIST_75'
    ELSE participant_id
END
WHERE score_type = 'official'
  AND stage IN ('Pre Camp', 'Camp', 'Grand Final')
  AND TRIM(participant_name) IN (
    'Firli Farouq Al Fahri',
    'Charla Ranadhiya Tabitha.Z',
    'Muhammad Nabil Fata Anaza',
    'Rameyza Alya Rabbania',
    'Rakeyan Muhammad Braja Pamungkas',
    'Meysa aurelia akbar',
    'Harya Gilang Bagaskara',
    'Sabrina Putri Cantika',
    'Sanjit Saputra',
    'Kezia Hirano Danito',
    'Willyam Sahat Pul Sitompul',
    'Nayla Balqis',
    'Arya Syaputra',
    'Chelsi Annisa',
    'Fikri Ismail',
    'Jho Funny Cantika Barus',
    'Alfajar Madani',
    'Dina Hulbi Aulia',
    'Hadrian Ivander Kusuma',
    'Rebecca Theresia Nauli Rajagukguk'
  );

UPDATE judge_scores
SET participant_id = CONCAT('P_API_', SUBSTRING(participant_id, 14))
WHERE participant_id LIKE 'TMP_FINALIST_%'
  AND score_type = 'official'
  AND stage IN ('Pre Camp', 'Camp', 'Grand Final');

COMMIT;

SELECT
    stage,
    COUNT(*) AS score_rows,
    COUNT(DISTINCT participant_id) AS participants,
    COUNT(DISTINCT judge_user_id) AS judges
FROM judge_scores
WHERE score_type = 'official'
  AND stage IN ('Pre Camp', 'Camp', 'Grand Final')
GROUP BY stage
ORDER BY stage;

SELECT
    participant_id,
    participant_name,
    stage,
    COUNT(DISTINCT judge_user_id) AS judges
FROM judge_scores
WHERE score_type = 'official'
  AND stage IN ('Pre Camp', 'Camp', 'Grand Final')
GROUP BY participant_id, participant_name, stage
ORDER BY stage, participant_id;
