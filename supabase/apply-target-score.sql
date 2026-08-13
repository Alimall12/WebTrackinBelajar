-- =====================================================================
-- JALANKAN FILE INI DI: Supabase Dashboard -> SQL Editor -> New query
-- (atau biarkan Claude Code yang apply lewat POSTGRES_URL_NON_POOLING)
--
-- Menambahkan kolom target_score ke tabel profiles untuk menyimpan
-- target skor UTBK (skala 0–1200, sama dengan tryout_results.average_score).
--
-- Aman di-run berulang (menggunakan IF NOT EXISTS).
-- =====================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_score INT;

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Verifikasi: kolom target_score harus ada di tabel profiles
-- ---------------------------------------------------------------------
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'target_score';
