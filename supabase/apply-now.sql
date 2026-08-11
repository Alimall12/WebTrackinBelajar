-- =====================================================================
-- JALANKAN FILE INI DI: Supabase Dashboard -> SQL Editor -> New query
-- (atau biarkan Claude Code yang apply lewat POSTGRES_URL_NON_POOLING)
--
-- Skema kurikulum "Capaian Belajar" — TERPISAH dari subtopics/user_progress
-- (yang tetap dipakai halaman Materi untuk video). Alasan tabel baru:
--   1. daftar kurikulumnya jauh lebih lengkap dari daftar video
--   2. satu submateri bisa masuk 2 subtes sekaligus (mis. PK + PM), yang
--      tidak bisa diwakili subtopics.subtest_code (single FK)
--
-- Aman di-run berulang. Seed data kurikulum menyusul (menunggu Excel).
-- =====================================================================

-- Grup materi (kolom "Materi": "Logika Dasar", "Ejaan", "Geometri", ...)
CREATE TABLE IF NOT EXISTS checklist_groups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- Item/submateri (kolom "Submateri")
CREATE TABLE IF NOT EXISTS checklist_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID REFERENCES checklist_groups(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    sort_order INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_group ON checklist_items(group_id);

-- Junction item <-> subtes. Satu item boleh punya 1 ATAU 2 baris di sini;
-- item lintas-subtes otomatis ikut dihitung di kedua subtes karena semua
-- agregasi capaian JOIN lewat tabel ini.
CREATE TABLE IF NOT EXISTS checklist_item_subtests (
    item_id      UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
    subtest_code TEXT REFERENCES subtests(code),
    PRIMARY KEY (item_id, subtest_code)
);
CREATE INDEX IF NOT EXISTS idx_checklist_is_subtest
  ON checklist_item_subtests(subtest_code);

-- Status centang per user per item (bukan user_progress — itu milik video)
CREATE TABLE IF NOT EXISTS user_checklist_status (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id      UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
    is_belajar   BOOLEAN DEFAULT FALSE,
    is_latsol    BOOLEAN DEFAULT FALSE,
    is_review    BOOLEAN DEFAULT FALSE,
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_checklist_status_user ON user_checklist_status(user_id);

-- ---------------------------------------------------------------------
-- RLS: status = milik sendiri; 3 tabel referensi = semua baca, admin tulis
-- ---------------------------------------------------------------------
ALTER TABLE user_checklist_status   ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_item_subtests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist status own" ON user_checklist_status;
CREATE POLICY "checklist status own" ON user_checklist_status FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "checklist ref read" ON checklist_groups;
CREATE POLICY "checklist ref read" ON checklist_groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "checklist ref admin write" ON checklist_groups;
CREATE POLICY "checklist ref admin write" ON checklist_groups FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "checklist ref read" ON checklist_items;
CREATE POLICY "checklist ref read" ON checklist_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "checklist ref admin write" ON checklist_items;
CREATE POLICY "checklist ref admin write" ON checklist_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "checklist ref read" ON checklist_item_subtests;
CREATE POLICY "checklist ref read" ON checklist_item_subtests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "checklist ref admin write" ON checklist_item_subtests;
CREATE POLICY "checklist ref admin write" ON checklist_item_subtests FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_checklist_status_touch ON user_checklist_status;
CREATE TRIGGER trg_checklist_status_touch
  BEFORE UPDATE ON user_checklist_status
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Cek: 4 tabel harus ada, jumlah seed masih 0 sampai Excel masuk
-- ---------------------------------------------------------------------
SELECT
  to_regclass('public.checklist_groups')        IS NOT NULL AS ada_groups,
  to_regclass('public.checklist_items')         IS NOT NULL AS ada_items,
  to_regclass('public.checklist_item_subtests') IS NOT NULL AS ada_junction,
  to_regclass('public.user_checklist_status')   IS NOT NULL AS ada_status;

SELECT
  (SELECT COUNT(*) FROM checklist_groups)        AS n_groups,
  (SELECT COUNT(*) FROM checklist_items)         AS n_items,
  (SELECT COUNT(*) FROM checklist_item_subtests) AS n_mapping;
