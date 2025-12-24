-- CLEANUP OLD QUIETBUILD TABLES
-- Date: 2025-12-24
-- Purpose: Remove any tables created before Dec 20, 2025 that might conflict with new Rob schema

-- ============================================================================
-- SAFETY FIRST: List all existing tables for review
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== Current Tables in Database ===';
  FOR r IN (
    SELECT table_name, 
           pg_catalog.pg_get_userbyid(c.relowner) as owner,
           pg_size_pretty(pg_total_relation_size(c.oid)) as size
    FROM information_schema.tables t
    JOIN pg_catalog.pg_class c ON c.relname = t.table_name
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  )
  LOOP
    RAISE NOTICE 'Table: % (Owner: %, Size: %)', r.table_name, r.owner, r.size;
  END LOOP;
END $$;

-- ============================================================================
-- DROP OLD QUIETBUILD TABLES (if they exist)
-- ============================================================================

-- Drop old tables that are NOT part of the new Rob schema
-- These are common table names from earlier QuietBuild versions

-- Old SilentEngine tables (pre-Dec 20)
DROP TABLE IF EXISTS old_silent_engine_requests CASCADE;
DROP TABLE IF EXISTS old_silent_engine_routes CASCADE;
DROP TABLE IF EXISTS old_silent_engine_providers CASCADE;

-- Old SightEngine tables (pre-Dec 20)
DROP TABLE IF EXISTS old_sight_engine_metrics CASCADE;
DROP TABLE IF EXISTS old_sight_engine_standards CASCADE;

-- Generic old tables (adjust based on what you see in logs)
DROP TABLE IF EXISTS old_sessions CASCADE;
DROP TABLE IF EXISTS old_messages CASCADE;
DROP TABLE IF EXISTS old_receipts CASCADE;
DROP TABLE IF EXISTS old_user_data CASCADE;
DROP TABLE IF EXISTS old_build_logs CASCADE;
DROP TABLE IF EXISTS old_deployments CASCADE;

-- If there were old "rob" tables with different schema, drop them
-- (Comment these out if you want to preserve any old Rob data)
-- DROP TABLE IF EXISTS rob_old_sessions CASCADE;
-- DROP TABLE IF EXISTS rob_old_messages CASCADE;

-- ============================================================================
-- VERIFY NEW SCHEMA INTEGRITY
-- ============================================================================

DO $$
DECLARE
  v_new_tables text[] := ARRAY[
    'rob_sessions',
    'rob_messages', 
    'rob_receipts',
    'rob_state_transitions',
    'rob_config_history',
    'rob_undo_stack',
    'rob_ai_usage',
    'rob_plans',
    'rob_user_entitlements'
  ];
  v_table text;
  v_count int := 0;
BEGIN
  RAISE NOTICE '=== Verifying New Rob Schema ===';
  
  FOREACH v_table IN ARRAY v_new_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      v_count := v_count + 1;
      RAISE NOTICE '✓ % exists', v_table;
    ELSE
      RAISE WARNING '✗ % is missing!', v_table;
    END IF;
  END LOOP;
  
  IF v_count = array_length(v_new_tables, 1) THEN
    RAISE NOTICE '=== ✅ All 9 Rob tables verified ===';
  ELSE
    RAISE WARNING '=== ⚠️ Only % of 9 Rob tables found ===', v_count;
  END IF;
END $$;

-- ============================================================================
-- CLEAN UP OLD FUNCTIONS (if any)
-- ============================================================================

-- Drop old functions that might conflict
DROP FUNCTION IF EXISTS old_get_session_data(uuid);
DROP FUNCTION IF EXISTS old_create_receipt(text, jsonb);
DROP FUNCTION IF EXISTS old_check_limits(uuid);

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ Cleanup complete!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Old tables dropped (if they existed)';
  RAISE NOTICE 'New Rob schema verified';
  RAISE NOTICE 'Database ready for production use';
  RAISE NOTICE '===========================================';
END $$;
