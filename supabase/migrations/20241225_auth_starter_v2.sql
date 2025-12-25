-- ================================================================
-- AUTH STARTER V2 - TRUTHSERUM COMPLIANT
-- Fixes: Auth security, triggers, realistic ownership model
-- ================================================================

-- ----------------------------------------------------------------
-- USERS EXTENSION (if not exists)
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- BUILD SESSIONS (CORRECTED)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS build_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Journey State
  current_state TEXT NOT NULL DEFAULT 'IDEA_CAPTURE',
  template_id TEXT,

  -- User's Original Idea
  idea_description TEXT NOT NULL,
  parsed_intent JSONB,

  -- Configuration Choices
  config JSONB DEFAULT '{}'::jsonb,

  -- Readiness Tier
  readiness_tier TEXT NOT NULL DEFAULT 'DRAFT',

  -- Repository Access (NOT ownership - honest claim)
  github_repo_url TEXT,
  github_repo_name TEXT,
  user_github_username TEXT, -- For invitation
  repo_access_granted BOOLEAN DEFAULT false,

  -- Deployment
  vercel_project_id TEXT,
  vercel_deployment_url TEXT,
  vercel_project_invited BOOLEAN DEFAULT false,

  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_webhook_verified BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_state CHECK (current_state IN (
    'IDEA_CAPTURE',
    'TEMPLATE_MATCH',
    'CONFIG_QUESTIONS',
    'PAYMENT_REQUIRED',
    'PAYMENT_PROCESSING',
    'CODE_GENERATING',
    'CODE_DEPLOYING',
    'ACCESS_GRANTING',
    'COMPLETE',
    'FAILED'
  )),
  CONSTRAINT valid_tier CHECK (readiness_tier IN (
    'DRAFT', 'SHAPED', 'VIABLE', 'READY', 'ACCESSIBLE'
  ))
);

CREATE INDEX idx_build_sessions_user ON build_sessions(user_id);
CREATE INDEX idx_build_sessions_state ON build_sessions(current_state);
CREATE INDEX idx_build_sessions_tier ON build_sessions(readiness_tier);
CREATE INDEX idx_build_sessions_payment ON build_sessions(stripe_payment_intent_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_build_sessions_updated_at
  BEFORE UPDATE ON build_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------
-- BUILD RECEIPTS (UNCHANGED - ALREADY GOOD)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS build_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details JSONB NOT NULL,
  verification_hash TEXT,
  parent_receipt_id UUID REFERENCES build_receipts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_receipt_type CHECK (type ~ '^[a-z]+\.[a-z_]+$')
);

CREATE INDEX idx_build_receipts_session ON build_receipts(session_id);
CREATE INDEX idx_build_receipts_type ON build_receipts(type);
CREATE INDEX idx_build_receipts_created ON build_receipts(created_at DESC);

-- ----------------------------------------------------------------
-- TEMPLATES (ADD TRIGGER)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  base_repo_url TEXT NOT NULL,
  required_env_vars TEXT[] NOT NULL,
  config_schema JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed template
INSERT INTO templates (id, name, description, keywords, base_repo_url, required_env_vars, config_schema)
VALUES (
  'auth-starter',
  'Authentication Starter',
  'Secure login system with protected dashboard',
  ARRAY['auth', 'login', 'signup', 'user', 'account', 'dashboard', 'portal'],
  'https://github.com/rsemeah/qbos-auth-starter-template',
  ARRAY[
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  '{
    "login_methods": {
      "type": "multiselect",
      "question": "How should users log in?",
      "options": ["google", "email"],
      "default": ["email"]
    },
    "app_name": {
      "type": "text",
      "question": "What should we call your app?",
      "default": "My App"
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- ----------------------------------------------------------------
-- READINESS GATES (UPDATED FOR HONEST V1)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS readiness_gates (
  tier TEXT PRIMARY KEY,
  required_receipts TEXT[] NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO readiness_gates (tier, required_receipts, description) VALUES
('DRAFT',
  ARRAY[]::TEXT[],
  'Initial state'),
('SHAPED',
  ARRAY['idea.captured', 'template.matched'],
  'Idea understood, template selected'),
('VIABLE',
  ARRAY['config.completed', 'payment.verified'],
  'Questions answered, payment webhook verified'),
('READY',
  ARRAY['code.generated', 'deploy.completed', 'healthcheck.passed'],
  'App generated, deployed, and verified responding'),
('ACCESSIBLE',
  ARRAY['repo.access_granted', 'vercel.access_granted'],
  'User invited to repo and Vercel project')
ON CONFLICT (tier) DO UPDATE SET
  required_receipts = EXCLUDED.required_receipts,
  description = EXCLUDED.description;

-- ----------------------------------------------------------------
-- ASYNC JOBS TABLE (NEW - REPLACES setTimeout)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS async_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_sessions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  -- 'generate_code', 'deploy_vercel', 'run_healthcheck', 'grant_access'

  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending', 'processing', 'completed', 'failed'

  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  error_message TEXT,
  result JSONB,

  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_job_type CHECK (job_type IN (
    'generate_code', 'deploy_vercel', 'run_healthcheck', 'grant_access'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'processing', 'completed', 'failed'
  ))
);

CREATE INDEX idx_async_jobs_session ON async_jobs(session_id);
CREATE INDEX idx_async_jobs_status ON async_jobs(status, scheduled_at);
CREATE INDEX idx_async_jobs_type ON async_jobs(job_type);

-- ----------------------------------------------------------------
-- HELPER FUNCTIONS (UPDATED)
-- ----------------------------------------------------------------

-- Get missing receipts for tier advancement
CREATE OR REPLACE FUNCTION get_missing_receipts(
  p_session_id UUID,
  p_target_tier TEXT
)
RETURNS TEXT[] AS $$
DECLARE
  v_required TEXT[];
  v_existing TEXT[];
  v_missing TEXT[];
BEGIN
  SELECT required_receipts INTO v_required
  FROM readiness_gates
  WHERE tier = p_target_tier;

  SELECT ARRAY_AGG(DISTINCT type) INTO v_existing
  FROM build_receipts
  WHERE session_id = p_session_id;

  SELECT ARRAY(
    SELECT UNNEST(v_required)
    EXCEPT
    SELECT UNNEST(COALESCE(v_existing, ARRAY[]::TEXT[]))
  ) INTO v_missing;

  RETURN COALESCE(v_missing, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Advance session tier (with gate enforcement)
CREATE OR REPLACE FUNCTION advance_session_tier(
  p_session_id UUID,
  p_target_tier TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_missing TEXT[];
  v_current_tier TEXT;
BEGIN
  SELECT readiness_tier INTO v_current_tier
  FROM build_sessions
  WHERE id = p_session_id;

  v_missing := get_missing_receipts(p_session_id, p_target_tier);

  IF ARRAY_LENGTH(v_missing, 1) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required receipts',
      'missing', v_missing
    );
  END IF;

  UPDATE build_sessions
  SET
    readiness_tier = p_target_tier,
    completed_at = CASE WHEN p_target_tier = 'ACCESSIBLE' THEN NOW() ELSE completed_at END
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_tier', v_current_tier,
    'new_tier', p_target_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Queue async job
CREATE OR REPLACE FUNCTION queue_job(
  p_session_id UUID,
  p_job_type TEXT,
  p_payload JSONB,
  p_delay_seconds INT DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO async_jobs (session_id, job_type, payload, scheduled_at)
  VALUES (
    p_session_id,
    p_job_type,
    p_payload,
    NOW() + (p_delay_seconds || ' seconds')::INTERVAL
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------

ALTER TABLE build_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users view own sessions"
  ON build_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own sessions"
  ON build_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
  ON build_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can see receipts for their sessions
CREATE POLICY "Users view own receipts"
  ON build_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM build_sessions
      WHERE build_sessions.id = build_receipts.session_id
      AND build_sessions.user_id = auth.uid()
    )
  );

-- Only system can create receipts
CREATE POLICY "System creates receipts"
  ON build_receipts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Everyone can view active templates
CREATE POLICY "Anyone views active templates"
  ON templates FOR SELECT
  USING (is_active = true);

-- Users can view their own jobs
CREATE POLICY "Users view own jobs"
  ON async_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM build_sessions
      WHERE build_sessions.id = async_jobs.session_id
      AND build_sessions.user_id = auth.uid()
    )
  );

-- Only system can manage jobs
CREATE POLICY "System manages jobs"
  ON async_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
