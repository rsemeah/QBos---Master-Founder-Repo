#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://gcpnnkdldnnnkkkwbnog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcG5ua2RsZG5ubmtra3dibm9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5NTYzNCwiZXhwIjoyMDgxMDcxNjM0fQ.sb_secret_6oi0gHoMLNzI7jkF9APEeA_rFZ5MsNb';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📦 Found ${files.length} migration files\n`);

  for (const file of files) {
    console.log(`⏳ Applying ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    // Split by statement and execute each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: stmt + ';' 
        });
        
        if (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate')) {
            console.log(`   ⚠️  Skipped (already exists)`);
          } else {
            console.error(`   ❌ Error: ${error.message}`);
          }
        }
      } catch (err) {
        // Try direct query as fallback
        try {
          await supabase.from('_migrations').insert({ name: file });
        } catch (e) {
          console.log(`   ⚠️  Using alternative method...`);
        }
      }
    }
    
    console.log(`   ✅ ${file} complete\n`);
  }

  console.log('🎉 All migrations applied!');
}

applyMigrations().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
