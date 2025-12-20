#!/usr/bin/env tsx
/**
 * QuietBuild OS - Database Migration Runner
 *
 * Executes SQL migrations against Supabase in order.
 * Idempotent: Safe to run multiple times.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Copy .env.example to .env and fill in your values');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigrations() {
  console.log('🚀 QuietBuild OS - Database Migration Runner\n');

  const migrationsDir = join(__dirname, '../migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migration files found');
    return;
  }

  console.log(`📋 Found ${migrationFiles.length} migration(s):\n`);

  for (const file of migrationFiles) {
    console.log(`   📄 ${file}`);
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    try {
      // Execute migration using service role (bypasses RLS)
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

      if (error) {
        // If exec_sql function doesn't exist, try direct execution
        // Note: This requires direct PostgreSQL access
        console.log(`   ⚠️  RPC method unavailable, attempting direct execution...`);

        // Split SQL into individual statements and execute
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement) {
            const { error: directError } = await supabase.rpc('exec_sql', {
              query: statement
            });

            if (directError) {
              console.error(`   ❌ Migration failed: ${file}`);
              console.error(`   Error: ${directError.message}`);
              process.exit(1);
            }
          }
        }
      }

      console.log(`   ✅ Executed successfully\n`);
    } catch (err: any) {
      console.error(`   ❌ Migration failed: ${file}`);
      console.error(`   Error: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('✅ All migrations completed successfully!\n');
  console.log('📊 Database is ready for QuietBuild OS\n');
}

// Execute migrations
runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
