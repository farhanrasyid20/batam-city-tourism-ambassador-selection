-- Reset semua peserta ke tahap Audition + normalisasi participant_code:
-- Encik = nomor ganjil (ECK-001,003,...)
-- Puan  = nomor genap (PUA-002,004,...)
--
-- Jalankan di phpMyAdmin / MySQL (disarankan backup dulu DB).

START TRANSACTION;

-- 1) Reset status seleksi semua peserta ke Audition.
UPDATE participant_profiles
SET
  selection_status = 'Audition',
  selection_status_note = 'Reset massal ke tahap Audition',
  selection_status_updated_at = NOW(),
  eliminated_in_audition = 0,
  eliminated_at = NULL;

-- 2) Susun ranking internal per gender berdasarkan nomor audisi.
DROP TEMPORARY TABLE IF EXISTS tmp_encik_rank;
SET @encik_rn := 0;
CREATE TEMPORARY TABLE tmp_encik_rank AS
SELECT
  pp.id,
  (@encik_rn := @encik_rn + 1) AS rn
FROM participant_profiles pp
WHERE pp.gender = 'Encik'
ORDER BY
  CAST(SUBSTRING_INDEX(pp.audition_number, '-', -1) AS UNSIGNED),
  pp.id;

DROP TEMPORARY TABLE IF EXISTS tmp_puan_rank;
SET @puan_rn := 0;
CREATE TEMPORARY TABLE tmp_puan_rank AS
SELECT
  pp.id,
  (@puan_rn := @puan_rn + 1) AS rn
FROM participant_profiles pp
WHERE pp.gender = 'Puan'
ORDER BY
  CAST(SUBSTRING_INDEX(pp.audition_number, '-', -1) AS UNSIGNED),
  pp.id;

-- 3) Update code Encik jadi ganjil.
UPDATE participant_profiles pp
JOIN tmp_encik_rank r ON r.id = pp.id
SET pp.participant_code = CONCAT('ECK-', LPAD((r.rn * 2) - 1, 3, '0'));

-- 4) Update code Puan jadi genap.
UPDATE participant_profiles pp
JOIN tmp_puan_rank r ON r.id = pp.id
SET pp.participant_code = CONCAT('PUA-', LPAD((r.rn * 2), 3, '0'));

-- 5) (Opsional) selaraskan participant_number ke audition_number.
UPDATE participant_profiles
SET participant_number = audition_number
WHERE audition_number IS NOT NULL AND audition_number <> '';

COMMIT;

-- Verifikasi hasil:
-- SELECT id, audition_number, participant_code, gender, selection_status
-- FROM participant_profiles
-- ORDER BY CAST(SUBSTRING_INDEX(audition_number, '-', -1) AS UNSIGNED), id;
