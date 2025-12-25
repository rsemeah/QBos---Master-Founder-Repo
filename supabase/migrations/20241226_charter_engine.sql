-- Charter Engine™ Migration
-- User Consent and Data Governance Tables

-- Consent Records Table
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('essential', 'analytics', 'marketing', 'ai_training', 'third_party')),
  status TEXT NOT NULL CHECK (status IN ('granted', 'withdrawn', 'expired')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user consent lookups
CREATE INDEX idx_consent_records_user_purpose ON consent_records(user_id, purpose);
CREATE INDEX idx_consent_records_status ON consent_records(status);
CREATE INDEX idx_consent_records_expires_at ON consent_records(expires_at) WHERE expires_at IS NOT NULL;

-- Data Right Requests Table (GDPR Article 15-20)
CREATE TABLE IF NOT EXISTS data_right_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('access', 'rectification', 'erasure', 'portability', 'restriction')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tracking request status
CREATE INDEX idx_data_right_requests_user ON data_right_requests(user_id);
CREATE INDEX idx_data_right_requests_status ON data_right_requests(status);
CREATE INDEX idx_data_right_requests_type ON data_right_requests(type);

-- Row Level Security Policies

-- Consent Records RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent records"
  ON consent_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent records"
  ON consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent records"
  ON consent_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Data Right Requests RLS
ALTER TABLE data_right_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data requests"
  ON data_right_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data requests"
  ON data_right_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own data requests updates"
  ON data_right_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Helper Functions

-- Function to check if user has active consent
CREATE OR REPLACE FUNCTION check_user_consent(
  p_user_id UUID,
  p_purpose TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_record consent_records%ROWTYPE;
BEGIN
  -- Essential purposes always allowed
  IF p_purpose = 'essential' THEN
    RETURN TRUE;
  END IF;

  -- Get latest consent record for user + purpose
  SELECT * INTO v_record
  FROM consent_records
  WHERE user_id = p_user_id
    AND purpose = p_purpose
  ORDER BY created_at DESC
  LIMIT 1;

  -- No record found
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check status
  IF v_record.status != 'granted' THEN
    RETURN FALSE;
  END IF;

  -- Check expiry
  IF v_record.expires_at IS NOT NULL AND v_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_right_requests_updated_at
  BEFORE UPDATE ON data_right_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON consent_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_right_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
