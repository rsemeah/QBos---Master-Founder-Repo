-- ROB THE QUIETBUILDER — DATABASE SCHEMA
-- Version: 1.0
-- Constitutional Compliance: Required

-- ============================================================================
-- CORE SESSION MANAGEMENT
-- ============================================================================

-- Rob Sessions (build sessions)
CREATE TABLE IF NOT EXISTS rob_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  app_name text,
  progress_percent int DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  readiness_tier text DEFAULT 'draft' CHECK (readiness_tier IN ('draft', 'shaped', 'viable', 'ready', 'published')),
  current_state text DEFAULT 'INIT' CHECK (current_state IN (
    'INIT', 'WAITING', 'LISTENING', 'CLARIFYING', 'CONFIRMING',
    'BUILDING', 'VERIFYING', 'READY', 'BLOCKED', 'UNKNOWN',
    'VIEW_ONLY', 'DEFERRED', 'PUBLISHED'
  )),
  app_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rob Messages (conversation history)
CREATE TABLE IF NOT EXISTS rob_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES rob_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TRUTH & AUDIT LAYER
-- ============================================================================

-- Rob Receipts (append-only audit trail)
CREATE TABLE IF NOT EXISTS rob_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES rob_sessions(id) ON DELETE CASCADE,
  type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  caused_by_message_id uuid REFERENCES rob_messages(id) ON DELETE SET NULL,
  caused_by_rule text,
  caused_by_constraint text,
  created_at timestamptz DEFAULT now()
);

-- Rob State Transitions (state machine audit)
CREATE TABLE IF NOT EXISTS rob_state_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES rob_sessions(id) ON DELETE CASCADE,
  from_state text NOT NULL,
  to_state text NOT NULL,
  reason text,
  triggered_by_message_id uuid REFERENCES rob_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Rob Config History (for replay and undo)
CREATE TABLE IF NOT EXISTS rob_config_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES rob_sessions(id) ON DELETE CASCADE,
  key text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by_message_id uuid REFERENCES rob_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Rob Undo Stack (pre-publish undo support)
CREATE TABLE IF NOT EXISTS rob_undo_stack (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES rob_sessions(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- AI USAGE TRACKING
-- ============================================================================

-- Rob AI Usage (for billing and analytics)
CREATE TABLE IF NOT EXISTS rob_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES rob_sessions(id) ON DELETE CASCADE,
  triggered_by_message_id uuid REFERENCES rob_messages(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model text NOT NULL,
  tokens_in int NOT NULL,
  tokens_out int NOT NULL,
  cost_usd numeric(10,6) NOT NULL,
  latency_ms int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- BILLING & ENTITLEMENTS
-- ============================================================================

-- Rob Plans (subscription tiers)
CREATE TABLE IF NOT EXISTS rob_plans (
  id text PRIMARY KEY CHECK (id IN ('free', 'pro', 'team')),
  limits jsonb NOT NULL DEFAULT '{
    "ai_messages_per_day": 50,
    "deploys_per_day": 3,
    "sessions_active": 1,
    "undo_stack_depth": 10,
    "preview_refreshes_per_hour": 20
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rob User Entitlements (user subscription status)
CREATE TABLE IF NOT EXISTS rob_user_entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text REFERENCES rob_plans(id) NOT NULL DEFAULT 'free',
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Session lookups
CREATE INDEX IF NOT EXISTS idx_rob_sessions_user_id ON rob_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rob_sessions_created_at ON rob_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rob_sessions_state ON rob_sessions(current_state);

-- Message lookups
CREATE INDEX IF NOT EXISTS idx_rob_messages_session_id ON rob_messages(session_id, created_at);

-- Receipt lookups
CREATE INDEX IF NOT EXISTS idx_rob_receipts_session_id ON rob_receipts(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rob_receipts_type ON rob_receipts(type);
CREATE INDEX IF NOT EXISTS idx_rob_receipts_message_id ON rob_receipts(caused_by_message_id);

-- State transition lookups
CREATE INDEX IF NOT EXISTS idx_rob_state_transitions_session_id ON rob_state_transitions(session_id, created_at);

-- Config history lookups
CREATE INDEX IF NOT EXISTS idx_rob_config_history_session_id ON rob_config_history(session_id, created_at);

-- AI usage lookups
CREATE INDEX IF NOT EXISTS idx_rob_ai_usage_session_id ON rob_ai_usage(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rob_ai_usage_user_lookup ON rob_ai_usage(session_id, created_at) 
  INCLUDE (tokens_in, tokens_out, cost_usd);

-- Entitlements lookups
CREATE INDEX IF NOT EXISTS idx_rob_entitlements_plan_id ON rob_user_entitlements(plan_id);
CREATE INDEX IF NOT EXISTS idx_rob_entitlements_status ON rob_user_entitlements(status);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATED TIMESTAMPS
-- ============================================================================

-- Update rob_sessions.updated_at on change
CREATE OR REPLACE FUNCTION update_rob_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rob_sessions_updated_at_trigger
  BEFORE UPDATE ON rob_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_rob_sessions_updated_at();

-- Update rob_user_entitlements.updated_at on change
CREATE OR REPLACE FUNCTION update_rob_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rob_entitlements_updated_at_trigger
  BEFORE UPDATE ON rob_user_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_rob_entitlements_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all rob_* tables
ALTER TABLE rob_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_config_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_undo_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE rob_user_entitlements ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can only see their own sessions
CREATE POLICY rob_sessions_user_policy ON rob_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- Messages: Access via session ownership
CREATE POLICY rob_messages_user_policy ON rob_messages
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rob_sessions WHERE user_id = auth.uid()
    )
  );

-- Receipts: Access via session ownership
CREATE POLICY rob_receipts_user_policy ON rob_receipts
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rob_sessions WHERE user_id = auth.uid()
    )
  );

-- State Transitions: Access via session ownership
CREATE POLICY rob_state_transitions_user_policy ON rob_state_transitions
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rob_sessions WHERE user_id = auth.uid()
    )
  );

-- Config History: Access via session ownership
CREATE POLICY rob_config_history_user_policy ON rob_config_history
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rob_sessions WHERE user_id = auth.uid()
    )
  );

-- Undo Stack: Access via session ownership
CREATE POLICY rob_undo_stack_user_policy ON rob_undo_stack
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rob_sessions WHERE user_id = auth.uid()
    )
  );

-- AI Usage: Access via session ownership
CREATE POLICY rob_ai_usage_user_policy ON rob_ai_usage
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rob_sessions WHERE user_id = auth.uid()
    )
  );

-- Plans: Read-only for all authenticated users
CREATE POLICY rob_plans_read_policy ON rob_plans
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Entitlements: Users can only see their own entitlements
CREATE POLICY rob_entitlements_user_policy ON rob_user_entitlements
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA (DEFAULT PLANS)
-- ============================================================================

INSERT INTO rob_plans (id, limits) VALUES
  ('free', '{
    "ai_messages_per_day": 50,
    "deploys_per_day": 3,
    "sessions_active": 1,
    "undo_stack_depth": 10,
    "preview_refreshes_per_hour": 20
  }'::jsonb),
  ('pro', '{
    "ai_messages_per_day": 500,
    "deploys_per_day": 50,
    "sessions_active": 10,
    "undo_stack_depth": 100,
    "preview_refreshes_per_hour": 200
  }'::jsonb),
  ('team', '{
    "ai_messages_per_day": 5000,
    "deploys_per_day": 500,
    "sessions_active": 100,
    "undo_stack_depth": 1000,
    "preview_refreshes_per_hour": 2000
  }'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  limits = EXCLUDED.limits,
  updated_at = now();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current AI usage for user (today)
CREATE OR REPLACE FUNCTION get_rob_ai_usage_today(p_user_id uuid)
RETURNS TABLE (
  messages_today bigint,
  tokens_used bigint,
  cost_today numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT rau.triggered_by_message_id)::bigint,
    SUM(rau.tokens_in + rau.tokens_out)::bigint,
    SUM(rau.cost_usd)::numeric
  FROM rob_ai_usage rau
  JOIN rob_sessions rs ON rau.session_id = rs.id
  WHERE rs.user_id = p_user_id
    AND rau.created_at >= date_trunc('day', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is within usage limits
CREATE OR REPLACE FUNCTION check_rob_usage_limits(p_user_id uuid)
RETURNS TABLE (
  within_limits boolean,
  messages_used bigint,
  messages_limit bigint,
  percentage_used numeric
) AS $$
DECLARE
  v_plan_limits jsonb;
  v_messages_today bigint;
  v_messages_limit bigint;
BEGIN
  -- Get user's plan limits
  SELECT rp.limits INTO v_plan_limits
  FROM rob_user_entitlements rue
  JOIN rob_plans rp ON rue.plan_id = rp.id
  WHERE rue.user_id = p_user_id;

  -- Default to free plan if no entitlement found
  IF v_plan_limits IS NULL THEN
    SELECT limits INTO v_plan_limits
    FROM rob_plans
    WHERE id = 'free';
  END IF;

  v_messages_limit := (v_plan_limits->>'ai_messages_per_day')::bigint;

  -- Get today's usage
  SELECT messages_today INTO v_messages_today
  FROM get_rob_ai_usage_today(p_user_id);

  v_messages_today := COALESCE(v_messages_today, 0);

  RETURN QUERY
  SELECT
    v_messages_today < v_messages_limit,
    v_messages_today,
    v_messages_limit,
    ROUND((v_messages_today::numeric / NULLIF(v_messages_limit, 0)) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables exist
DO $$
DECLARE
  v_tables text[] := ARRAY[
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
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      RAISE EXCEPTION 'Table % does not exist', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Rob database schema migration complete. All tables verified.';
END $$;
