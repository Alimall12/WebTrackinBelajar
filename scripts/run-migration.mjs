// scripts/run-migration.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = "https://sdnhptmuuajpitctuacp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbmhwdG11dWFqcGl0Y3R1YWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI4OTUzNiwiZXhwIjoyMTAxODY1NTM2fQ.Uuw7EY94XYsYTN0rFVvoQ4tf-vuXqnmzRlD0xDWNnZQ";

const supabase = createClient(supabaseUrl, supabaseKey);

// Read and execute SQL
const sql = readFileSync('supabase/apply-ai-requests.sql', 'utf8');

// Execute each statement
const statements = [
  `CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_at TIMESTAMPTZ DEFAULT NOW(),
    message_tokens INT DEFAULT 0,
    response_tokens INT DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ai_requests_user_time ON ai_requests(user_id, request_at DESC)`,
  `ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "ai requests own" ON ai_requests`,
  `CREATE POLICY "ai requests own" ON ai_requests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
];

for (const stmt of statements) {
  console.log('Executing:', stmt.substring(0, 50) + '...');
  const { error } = await supabase.rpc('exec', { sql: stmt });
  if (error) console.log('Note:', error.message);
}

console.log('Done! Check table manually in Supabase Dashboard.');
