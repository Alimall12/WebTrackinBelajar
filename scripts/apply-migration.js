// scripts/apply-migration.js
// Run database migration using POSTGRES_URL_NON_POOLING
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(sqlFile) {
  console.log(`Running migration: ${sqlFile}`);
  
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Split by statement and execute each
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== 'NOTIFY pgrst, \'reload schema\'');
  
  for (const statement of statements) {
    if (statement.startsWith('SELECT') && statement.includes('information_schema')) {
      // Verification query
      const { data, error } = await supabase.rpc('exec_sql', { query: statement });
      if (error) {
        console.log('Verification query (optional):', error.message);
      } else {
        console.log('Verification result:', data);
      }
    } else {
      // DDL statement
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      if (error) {
        console.error('Error executing statement:', error.message);
        console.error('Statement:', statement.substring(0, 100));
      }
    }
  }
  
  console.log('Migration completed!');
}

const migrationFile = process.argv[2] || path.join(__dirname, '..', 'supabase', 'apply-ai-requests.sql');
runMigration(migrationFile).catch(console.error);
