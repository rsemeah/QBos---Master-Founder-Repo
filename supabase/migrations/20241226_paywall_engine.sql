-- ================================================================
-- PaywallEngine tables
-- ================================================================

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  source TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT entitlement_key_nonempty CHECK (length(entitlement_key) > 0)
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id);
CREATE INDEX idx_entitlements_key ON entitlements(entitlement_key);

CREATE TRIGGER set_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT usage_entitlement_key_nonempty CHECK (length(entitlement_key) > 0)
);

CREATE INDEX idx_usage_records_user ON usage_records(user_id);
CREATE INDEX idx_usage_records_key ON usage_records(entitlement_key);

CREATE TRIGGER set_usage_records_updated_at
  BEFORE UPDATE ON usage_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlements_select_own
  ON entitlements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY entitlements_insert_own
  ON entitlements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY entitlements_update_own
  ON entitlements FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY usage_records_select_own
  ON usage_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY usage_records_insert_own
  ON usage_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY usage_records_update_own
  ON usage_records FOR UPDATE
  USING (user_id = auth.uid());
