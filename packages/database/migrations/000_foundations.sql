-- ============================================================================
-- QuietBuild OS - Foundation Migration
-- ============================================================================
-- This migration creates the core event-driven architecture foundation
-- All engines coordinate through the qbos_events table (database outbox pattern)

-- ============================================================================
-- EVENT OUTBOX SYSTEM (Database-Driven Events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qbos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'failed_permanent')),
  attempt_count INTEGER DEFAULT 0,
  next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT
);

-- Indexes for efficient event processing
CREATE INDEX idx_qbos_events_status ON qbos_events(status, next_attempt_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX idx_qbos_events_name ON qbos_events(name);
CREATE INDEX idx_qbos_events_created ON qbos_events(created_at DESC);

-- Row Level Security: Block direct access
ALTER TABLE qbos_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY qbos_events_no_direct_access ON qbos_events FOR ALL USING (FALSE);

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS (Controlled Access)
-- ============================================================================

-- Insert event (idempotent)
CREATE OR REPLACE FUNCTION insert_qbos_event(
  p_name TEXT,
  p_payload JSONB,
  p_metadata JSONB,
  p_idempotency_key TEXT
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Check for existing event with same idempotency key
  SELECT id INTO v_event_id
  FROM qbos_events
  WHERE idempotency_key = p_idempotency_key;

  IF v_event_id IS NOT NULL THEN
    RETURN v_event_id;
  END IF;

  -- Insert new event
  INSERT INTO qbos_events (name, payload, metadata, idempotency_key)
  VALUES (p_name, p_payload, p_metadata, p_idempotency_key)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Fetch and lock events for processing (worker function)
CREATE OR REPLACE FUNCTION fetch_and_lock_events(
  p_worker_id TEXT,
  p_batch_size INTEGER DEFAULT 100
) RETURNS TABLE (
  id UUID,
  name TEXT,
  payload JSONB,
  metadata JSONB,
  attempt_count INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE qbos_events
  SET
    status = 'processing',
    locked_at = NOW(),
    locked_by = p_worker_id
  WHERE qbos_events.id IN (
    SELECT e.id
    FROM qbos_events e
    WHERE e.status IN ('pending', 'failed')
      AND e.next_attempt_at <= NOW()
      AND (e.locked_at IS NULL OR e.locked_at < NOW() - INTERVAL '5 minutes')
    ORDER BY e.created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    qbos_events.id,
    qbos_events.name,
    qbos_events.payload,
    qbos_events.metadata,
    qbos_events.attempt_count;
END;
$$ LANGUAGE plpgsql;

-- Mark event as successfully processed
CREATE OR REPLACE FUNCTION mark_event_processed(p_event_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE qbos_events
  SET
    status = 'processed',
    processed_at = NOW(),
    locked_at = NULL,
    locked_by = NULL
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Mark event as failed (with exponential backoff)
CREATE OR REPLACE FUNCTION mark_event_failed(
  p_event_id UUID,
  p_attempt_count INTEGER,
  p_error TEXT,
  p_max_retries INTEGER DEFAULT 5
) RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_attempt_count INTEGER := p_attempt_count + 1;
  v_status TEXT;
  v_next_attempt TIMESTAMPTZ;
BEGIN
  IF v_new_attempt_count >= p_max_retries THEN
    v_status := 'failed_permanent';
    v_next_attempt := NULL;
  ELSE
    v_status := 'failed';
    -- Exponential backoff: 2^attempt_count minutes
    v_next_attempt := NOW() + (POWER(2, p_attempt_count)::INTEGER || ' minutes')::INTERVAL;
  END IF;

  UPDATE qbos_events
  SET
    status = v_status,
    attempt_count = v_new_attempt_count,
    next_attempt_at = v_next_attempt,
    error = p_error,
    locked_at = NULL,
    locked_by = NULL
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION insert_qbos_event TO authenticated;
GRANT EXECUTE ON FUNCTION fetch_and_lock_events TO authenticated;
GRANT EXECUTE ON FUNCTION mark_event_processed TO authenticated;
GRANT EXECUTE ON FUNCTION mark_event_failed TO authenticated;

-- ============================================================================
-- PROFILES TABLE (User Extensions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users own their profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUDIT LOG (System-Wide Event Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- RLS: Users can only see their own audit logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ QuietBuild OS Foundation Migration Complete';
  RAISE NOTICE '   - Event Outbox System: qbos_events';
  RAISE NOTICE '   - Security Functions: insert_qbos_event, fetch_and_lock_events';
  RAISE NOTICE '   - Profiles Table: profiles (with RLS)';
  RAISE NOTICE '   - Audit Log: audit_log';
END $$;
