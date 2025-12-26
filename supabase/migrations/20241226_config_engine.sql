-- ================================================================
-- ConfigEngine tables
-- ================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feature_flag_id_nonempty CHECK (length(id) > 0)
);

CREATE TRIGGER set_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id TEXT NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flag_overrides_user ON flag_overrides(user_id);
CREATE INDEX idx_flag_overrides_flag ON flag_overrides(flag_id);

CREATE TRIGGER set_flag_overrides_updated_at
  BEFORE UPDATE ON flag_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_select_authenticated
  ON feature_flags FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY feature_flags_write_authenticated
  ON feature_flags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY feature_flags_update_authenticated
  ON feature_flags FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY flag_overrides_select_own
  ON flag_overrides FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY flag_overrides_insert_own
  ON flag_overrides FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY flag_overrides_update_own
  ON flag_overrides FOR UPDATE
  USING (user_id = auth.uid());
