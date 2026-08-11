-- =====================================================================
-- LMS & Progress Tracker SNBT/UTBK — Supabase / PostgreSQL schema
-- Run this whole file in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE where possible).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Profiles Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name    VARCHAR(250),
    avatar_url   TEXT,
    target_ptn   VARCHAR(250),
    target_major VARCHAR(250),
    target_date  DATE DEFAULT '2027-02-28',
    is_admin     BOOLEAN DEFAULT FALSE,
    onboarded    BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. Subtests Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subtests (
    code VARCHAR(10) PRIMARY KEY, -- 'PU','PBM','PPU','PK','LBI','LBE','PM'
    name VARCHAR(250) NOT NULL,
    sort_order INT DEFAULT 0
);

INSERT INTO subtests (code, name, sort_order) VALUES
('PU',  'Penalaran Umum', 1),
('PBM', 'Pemahaman Bacaan dan Menulis', 2),
('PPU', 'Pengetahuan dan Pemahaman Umum', 3),
('PK',  'Pengetahuan Kuantitatif', 4),
('LBI', 'Literasi Bahasa Indonesia', 5),
('LBE', 'Literasi Bahasa Inggris', 6),
('PM',  'Penalaran Matematika', 7)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------
-- 3. Subtopics / Videos Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtest_code     VARCHAR(10) REFERENCES subtests(code) ON DELETE CASCADE,
    topic_name       VARCHAR(250) NOT NULL,
    subtopic_name    VARCHAR(250) NOT NULL,
    youtube_url      TEXT,
    video_id         VARCHAR(50),
    duration_seconds INT DEFAULT 0,
    sort_order       INT DEFAULT 0,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subtopics_subtest ON subtopics(subtest_code);

-- ---------------------------------------------------------------------
-- 4. User Progress Table  (3 status: belajar / latsol / review)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE,
    last_position_seconds INT DEFAULT 0,
    is_belajar  BOOLEAN DEFAULT FALSE,
    is_latsol   BOOLEAN DEFAULT FALSE,
    is_review   BOOLEAN DEFAULT FALSE,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subtopic_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);

-- ---------------------------------------------------------------------
-- 5. User Streaks Table  (one row per active day)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, activity_date)
);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks(user_id);

-- =====================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- keep user_progress.updated_at fresh
-- =====================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_progress_touch ON user_progress;
CREATE TRIGGER trg_progress_touch
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin? (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), FALSE);
$$;

-- ---- profiles ----
DROP POLICY IF EXISTS "profiles read all"      ON profiles;
DROP POLICY IF EXISTS "profiles update own"    ON profiles;
DROP POLICY IF EXISTS "profiles insert own"    ON profiles;
-- Everyone signed-in can read profiles (needed for the leaderboard avatars/names).
CREATE POLICY "profiles read all"   ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---- subtests (read-only reference data) ----
DROP POLICY IF EXISTS "subtests read" ON subtests;
CREATE POLICY "subtests read" ON subtests FOR SELECT TO authenticated USING (true);

-- ---- subtopics: everyone reads, only admins write ----
DROP POLICY IF EXISTS "subtopics read"  ON subtopics;
DROP POLICY IF EXISTS "subtopics admin write" ON subtopics;
CREATE POLICY "subtopics read"        ON subtopics FOR SELECT TO authenticated USING (true);
CREATE POLICY "subtopics admin write" ON subtopics FOR ALL   TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- user_progress: each user only their own rows ----
DROP POLICY IF EXISTS "progress own" ON user_progress;
CREATE POLICY "progress own" ON user_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---- user_streaks: each user only their own rows ----
DROP POLICY IF EXISTS "streaks own" ON user_streaks;
CREATE POLICY "streaks own" ON user_streaks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- LEADERBOARD  (aggregates every user's readiness; runs as definer so it
-- can see all users' progress while the base tables stay locked down)
-- readiness % = (belajar + latsol + review checks) / (total_subtopics * 3)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  readiness_pct NUMERIC,
  completed_belajar INT,
  streak_days INT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  total_subtopics INT;
BEGIN
  SELECT COUNT(*) INTO total_subtopics FROM subtopics;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(NULLIF(p.full_name, ''), 'Anonim')::TEXT AS full_name,
    p.avatar_url::TEXT,
    CASE WHEN total_subtopics = 0 THEN 0
         ELSE ROUND(
           (COALESCE(agg.checks, 0)::NUMERIC / (total_subtopics * 3)) * 100, 1)
    END AS readiness_pct,
    COALESCE(agg.belajar, 0)::INT AS completed_belajar,
    public.current_streak(p.id) AS streak_days
  FROM profiles p
  LEFT JOIN (
    -- Alias every column: bare `user_id` would clash with this function's
    -- OUT parameter of the same name ("column reference is ambiguous").
    SELECT up.user_id AS uid,
      SUM( (up.is_belajar)::INT + (up.is_latsol)::INT + (up.is_review)::INT ) AS checks,
      SUM( (up.is_belajar)::INT ) AS belajar
    FROM user_progress up
    GROUP BY up.user_id
  ) agg ON agg.uid = p.id
  ORDER BY readiness_pct DESC, completed_belajar DESC;
END;
$$;

-- Current consecutive-day streak ending today (or yesterday) for a user.
CREATE OR REPLACE FUNCTION public.current_streak(uid UUID)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  streak INT := 0;
  cur DATE := CURRENT_DATE;
BEGIN
  -- if no activity today, allow the streak to have ended yesterday
  IF NOT EXISTS (SELECT 1 FROM user_streaks WHERE user_id = uid AND activity_date = cur) THEN
    cur := cur - 1;
  END IF;

  LOOP
    IF EXISTS (SELECT 1 FROM user_streaks WHERE user_id = uid AND activity_date = cur) THEN
      streak := streak + 1;
      cur := cur - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN streak;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_streak(UUID) TO authenticated;

-- =====================================================================
-- OPTIONAL: promote yourself to admin (run once, replace the email)
--   UPDATE profiles SET is_admin = TRUE
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
-- =====================================================================

-- =====================================================================
-- 6. Catatan & daftar topik per submateri (dipakai di VideoOverlay)
-- =====================================================================
ALTER TABLE subtopics
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb;

-- =====================================================================
-- 7. Tryout Results Table  (riwayat nilai tryout per user)
--    average_score = generated column, dihitung di level database.
-- =====================================================================
CREATE TABLE IF NOT EXISTS tryout_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tryout_date   DATE NOT NULL,
    platform      VARCHAR(250),
    score_pu      NUMERIC(6,2) DEFAULT 0,
    score_pbm     NUMERIC(6,2) DEFAULT 0,
    score_ppu     NUMERIC(6,2) DEFAULT 0,
    score_pk      NUMERIC(6,2) DEFAULT 0,
    score_lbi     NUMERIC(6,2) DEFAULT 0,
    score_lbe     NUMERIC(6,2) DEFAULT 0,
    score_pm      NUMERIC(6,2) DEFAULT 0,
    average_score NUMERIC(6,2) GENERATED ALWAYS AS (
        (score_pu + score_pbm + score_ppu + score_pk + score_lbi + score_lbe + score_pm) / 7
    ) STORED,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tryout_user ON tryout_results(user_id, tryout_date);

ALTER TABLE tryout_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tryout own" ON tryout_results;
CREATE POLICY "tryout own" ON tryout_results FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_tryout_touch ON tryout_results;
CREATE TRIGGER trg_tryout_touch
  BEFORE UPDATE ON tryout_results
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- 8. User Checklists Table  (target belajar mandiri — halaman Jadwal Saya)
--    category = TEXT bebas (7 kode subtes + 'Umum'), sengaja tanpa FK
--    ke subtests karena 'Umum' bukan subtes resmi.
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_checklists (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT 'Umum',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checklists_user ON user_checklists(user_id);

ALTER TABLE user_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklists own" ON user_checklists;
CREATE POLICY "checklists own" ON user_checklists FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_checklists_touch ON user_checklists;
CREATE TRIGGER trg_checklists_touch
  BEFORE UPDATE ON user_checklists
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- 9. Kurikulum "Capaian Belajar" (terpisah dari subtopics/user_progress)
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
