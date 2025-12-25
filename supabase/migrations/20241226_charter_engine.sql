-- ================================================================
-- CharterEngine tables
-- ================================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT consent_type_nonempty CHECK (length(consent_type) > 0)
);

CREATE INDEX idx_consent_records_user ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);

CREATE TRIGGER set_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  details JSONB DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT data_request_type_nonempty CHECK (length(request_type) > 0)
);

CREATE INDEX idx_data_requests_user ON data_requests(user_id);
CREATE INDEX idx_data_requests_status ON data_requests(status);

CREATE TRIGGER set_data_requests_updated_at
  BEFORE UPDATE ON data_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_records_select_own
  ON consent_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY consent_records_insert_own
  ON consent_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY consent_records_update_own
  ON consent_records FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY data_requests_select_own
  ON data_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY data_requests_insert_own
  ON data_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY data_requests_update_own
  ON data_requests FOR UPDATE
  USING (user_id = auth.uid());
