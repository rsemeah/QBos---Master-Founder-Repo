-- Config Engine™ Migration
-- Feature Flags and Configuration Management Tables

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('enabled', 'disabled', 'conditional')),
  description TEXT,
  conditions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast flag lookups
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_status ON feature_flags(status);

-- Flag Overrides Table (user/org specific overrides)
CREATE TABLE IF NOT EXISTS flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL REFERENCES feature_flags(key) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('user', 'org', 'global')),
  scope_id UUID, -- user_id or org_id
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flag_key, scope, scope_id)
);

-- Index for override lookups
CREATE INDEX idx_flag_overrides_flag_key ON flag_overrides(flag_key);
CREATE INDEX idx_flag_overrides_scope ON flag_overrides(scope, scope_id);

-- Configuration Values Table
CREATE TABLE IF NOT EXISTS config_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'user', 'org')) DEFAULT 'global',
  scope_id UUID, -- user_id or org_id for scoped configs
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(key, scope, scope_id)
);

-- Index for config lookups
CREATE INDEX idx_config_values_key ON config_values(key);
CREATE INDEX idx_config_values_scope ON config_values(scope, scope_id);

-- Row Level Security Policies

-- Feature Flags RLS (read-only for users)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can modify flags
CREATE POLICY "Service role can manage feature flags"
  ON feature_flags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Flag Overrides RLS
ALTER TABLE flag_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flag overrides"
  ON flag_overrides FOR SELECT
  USING (
    scope = 'global' OR
    (scope = 'user' AND scope_id = auth.uid())
  );

CREATE POLICY "Service role can manage flag overrides"
  ON flag_overrides FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Config Values RLS
ALTER TABLE config_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read global and their own configs"
  ON config_values FOR SELECT
  USING (
    scope = 'global' OR
    (scope = 'user' AND scope_id = auth.uid())
  );

CREATE POLICY "Service role can manage config values"
  ON config_values FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper Functions

-- Function to check if feature is enabled for user
CREATE OR REPLACE FUNCTION is_feature_enabled(
  p_flag_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
  v_override flag_overrides%ROWTYPE;
BEGIN
  -- Get the flag
  SELECT * INTO v_flag
  FROM feature_flags
  WHERE key = p_flag_key;

  -- Flag not found, default to disabled
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check for user override
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_override
    FROM flag_overrides
    WHERE flag_key = p_flag_key
      AND scope = 'user'
      AND scope_id = p_user_id;

    IF FOUND THEN
      RETURN v_override.enabled;
    END IF;
  END IF;

  -- Check for org override
  IF p_org_id IS NOT NULL THEN
    SELECT * INTO v_override
    FROM flag_overrides
    WHERE flag_key = p_flag_key
      AND scope = 'org'
      AND scope_id = p_org_id;

    IF FOUND THEN
      RETURN v_override.enabled;
    END IF;
  END IF;

  -- Fall back to flag status
  IF v_flag.status = 'enabled' THEN
    RETURN TRUE;
  ELSIF v_flag.status = 'disabled' THEN
    RETURN FALSE;
  ELSE
    -- For conditional, would need to evaluate conditions
    -- Simplified: default to disabled for conditional without override
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get config value with fallback
CREATE OR REPLACE FUNCTION get_config_value(
  p_key TEXT,
  p_scope TEXT DEFAULT 'global',
  p_scope_id UUID DEFAULT NULL,
  p_default_value JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_config config_values%ROWTYPE;
BEGIN
  -- Try to get scoped config
  IF p_scope != 'global' AND p_scope_id IS NOT NULL THEN
    SELECT * INTO v_config
    FROM config_values
    WHERE key = p_key
      AND scope = p_scope
      AND scope_id = p_scope_id;

    IF FOUND THEN
      RETURN v_config.value;
    END IF;
  END IF;

  -- Fall back to global config
  SELECT * INTO v_config
  FROM config_values
  WHERE key = p_key
    AND scope = 'global';

  IF FOUND THEN
    RETURN v_config.value;
  END IF;

  -- Return default if provided
  RETURN p_default_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flag_overrides_updated_at
  BEFORE UPDATE ON flag_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_values_updated_at
  BEFORE UPDATE ON config_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON feature_flags TO authenticated;
GRANT SELECT ON flag_overrides TO authenticated;
GRANT SELECT ON config_values TO authenticated;
GRANT ALL ON feature_flags TO service_role;
GRANT ALL ON flag_overrides TO service_role;
GRANT ALL ON config_values TO service_role;
