-- Migration: Unify Receipt System with Chain Continuity
-- Date: 2026-01-23
-- Purpose: Add seq and prev_hash columns to build_receipts table for chain continuity
--          Migrate from HMAC-based receipts to unified TruthSerum EdDSA receipts

-- Add new columns to build_receipts table
ALTER TABLE build_receipts
  ADD COLUMN IF NOT EXISTS seq INTEGER,
  ADD COLUMN IF NOT EXISTS prev_hash TEXT;

-- Create index for efficient chain queries
CREATE INDEX IF NOT EXISTS idx_build_receipts_session_seq
  ON build_receipts (session_id, seq);

-- Add constraints
-- First receipt in session must have seq=0 and prev_hash=NULL
-- Subsequent receipts must have seq > 0 and prev_hash NOT NULL

-- Add check constraint for seq >= 0
ALTER TABLE build_receipts
  ADD CONSTRAINT chk_receipt_seq_non_negative
  CHECK (seq IS NULL OR seq >= 0);

-- Add partial unique index to ensure seq uniqueness within session
CREATE UNIQUE INDEX IF NOT EXISTS idx_build_receipts_session_seq_unique
  ON build_receipts (session_id, seq)
  WHERE seq IS NOT NULL AND session_id IS NOT NULL;

-- Migrate existing receipts: assign sequential numbers
-- This is a one-time migration for existing data
DO $$
DECLARE
  session_rec RECORD;
  receipt_rec RECORD;
  current_seq INTEGER;
  last_hash TEXT;
BEGIN
  -- For each session with receipts
  FOR session_rec IN
    SELECT DISTINCT session_id
    FROM build_receipts
    WHERE session_id IS NOT NULL
    AND seq IS NULL
    ORDER BY session_id
  LOOP
    current_seq := 0;
    last_hash := NULL;

    -- For each receipt in session, ordered by created_at
    FOR receipt_rec IN
      SELECT id, verification_hash
      FROM build_receipts
      WHERE session_id = session_rec.session_id
      AND seq IS NULL
      ORDER BY created_at ASC
    LOOP
      -- Update receipt with seq and prev_hash
      UPDATE build_receipts
      SET
        seq = current_seq,
        prev_hash = last_hash
      WHERE id = receipt_rec.id;

      -- Prepare for next iteration
      last_hash := receipt_rec.verification_hash;
      current_seq := current_seq + 1;
    END LOOP;

    RAISE NOTICE 'Migrated % receipts for session %', current_seq, session_rec.session_id;
  END LOOP;
END $$;

-- Add comment to document the change
COMMENT ON COLUMN build_receipts.seq IS 'Sequential number for chain ordering (0-indexed)';
COMMENT ON COLUMN build_receipts.prev_hash IS 'Hash of previous receipt in chain (null for first receipt)';

-- Create view for receipt chain validation
CREATE OR REPLACE VIEW receipt_chain_status AS
SELECT
  session_id,
  COUNT(*) as total_receipts,
  MIN(seq) as min_seq,
  MAX(seq) as max_seq,
  BOOL_AND(seq = 0 OR prev_hash IS NOT NULL) as chain_valid,
  ARRAY_AGG(id ORDER BY seq) as receipt_ids
FROM build_receipts
WHERE session_id IS NOT NULL
GROUP BY session_id;

COMMENT ON VIEW receipt_chain_status IS 'Summary of receipt chain integrity per session';
