-- =====================================================================
-- JALANKAN FILE INI DI: Supabase Dashboard -> SQL Editor -> New query
-- (atau lewat POSTGRES_URL_NON_POOLING di .env.local)
--
-- Menambahkan tabel ai_requests untuk rate limit AI Mentor:
-- 20 request per 3 jam per user.
--
-- Aman di-run berulang (menggunakan IF NOT EXISTS).
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_at TIMESTAMPTZ DEFAULT NOW(),
    message_tokens INT DEFAULT 0,
    response_tokens INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user_time 
    ON ai_requests(user_id, request_at DESC);

-- RLS: user hanya bisa akses baris miliknya sendiri
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai requests own" ON ai_requests;
CREATE POLICY "ai requests own" ON ai_requests FOR ALL TO authenticated
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Verifikasi: tabel ai_requests harus ada dengan index dan policy
-- ---------------------------------------------------------------------
SELECT
  table_name,
  (SELECT count(*) FROM pg_indexes WHERE tablename = 'ai_requests') as index_count,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'ai_requests') as policy_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'ai_requests';
