#!/usr/bin/env tsx
"use strict";
/**
 * QuietBuild OS - Database Reset Script
 *
 * WARNING: This destroys ALL data and recreates the schema.
 * ONLY for development/testing environments.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const fs_1 = require("fs");
const path_1 = require("path");
const readline = __importStar(require("readline"));
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
// Safety check: Prevent accidental production resets
if (NODE_ENV === 'production') {
    console.error('❌ FATAL: Database reset is DISABLED in production');
    console.error('   This command destroys all data and should never run in production');
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
async function promptConfirmation() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question('\n⚠️  WARNING: This will DELETE ALL DATA in your database!\n   Type "RESET" to confirm: ', (answer) => {
            rl.close();
            resolve(answer === 'RESET');
        });
    });
}
async function dropAllTables() {
    console.log('\n🗑️  Dropping all QuietBuild OS tables...\n');
    const tables = [
        'audit_log',
        'profiles',
        'qbos_events',
    ];
    for (const table of tables) {
        console.log(`   Dropping table: ${table}`);
        const { error } = await supabase.rpc('exec_sql', {
            sql_query: `DROP TABLE IF EXISTS ${table} CASCADE;`
        });
        if (error && !error.message.includes('does not exist')) {
            console.warn(`   ⚠️  Could not drop ${table}: ${error.message}`);
        }
    }
    // Drop functions
    const functions = [
        'insert_qbos_event',
        'fetch_and_lock_events',
        'mark_event_processed',
        'mark_event_failed',
        'update_updated_at_column',
    ];
    for (const func of functions) {
        console.log(`   Dropping function: ${func}`);
        const { error } = await supabase.rpc('exec_sql', {
            sql_query: `DROP FUNCTION IF EXISTS ${func} CASCADE;`
        });
        if (error && !error.message.includes('does not exist')) {
            console.warn(`   ⚠️  Could not drop ${func}: ${error.message}`);
        }
    }
    console.log('\n   ✅ All tables and functions dropped\n');
}
async function runMigrations() {
    console.log('🚀 Running migrations...\n');
    const migrationsDir = (0, path_1.join)(__dirname, '../migrations');
    const migrationFiles = (0, fs_1.readdirSync)(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    for (const file of migrationFiles) {
        console.log(`   📄 ${file}`);
        const filePath = (0, path_1.join)(migrationsDir, file);
        const sql = (0, fs_1.readFileSync)(filePath, 'utf-8');
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
            if (error) {
                console.error(`   ❌ Migration failed: ${file}`);
                console.error(`   Error: ${error.message}`);
                process.exit(1);
            }
            console.log(`   ✅ Executed successfully\n`);
        }
        catch (err) {
            console.error(`   ❌ Migration failed: ${file}`);
            console.error(`   Error: ${err.message}`);
            process.exit(1);
        }
    }
    console.log('✅ Database reset complete!\n');
    console.log('📊 Fresh QuietBuild OS schema is ready\n');
}
async function resetDatabase() {
    console.log('🔥 QuietBuild OS - Database Reset Tool');
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Database: ${SUPABASE_URL}\n`);
    const confirmed = await promptConfirmation();
    if (!confirmed) {
        console.log('\n❌ Reset cancelled\n');
        process.exit(0);
    }
    await dropAllTables();
    await runMigrations();
}
// Execute reset
resetDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=reset.js.map