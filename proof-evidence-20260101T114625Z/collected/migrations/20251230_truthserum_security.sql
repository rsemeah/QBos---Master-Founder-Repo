-- Trust registry for public keys
CREATE TABLE IF NOT EXISTS truthserum_public_keys (
  key_id TEXT PRIMARY KEY,
  public_key_pem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT false,
  CONSTRAINT only_one_active CHECK (
    is_active = false OR (
      (SELECT COUNT(*) FROM truthserum_public_keys WHERE is_active = true) <= 1
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_active_keys ON truthserum_public_keys(is_active, revoked_at);

-- Add submitted_by and delegation_level to receipts
ALTER TABLE IF EXISTS build_receipts
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

ALTER TABLE IF EXISTS build_receipts
ADD COLUMN IF NOT EXISTS delegation_level TEXT;

-- Enable RLS
ALTER TABLE IF EXISTS build_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS truthserum_public_keys ENABLE ROW LEVEL SECURITY;

-- Append-only policies for receipts
DROP POLICY IF EXISTS receipts_insert ON build_receipts;
DROP POLICY IF EXISTS receipts_read ON build_receipts;
DROP POLICY IF EXISTS receipts_no_update ON build_receipts;
DROP POLICY IF EXISTS receipts_no_delete ON build_receipts;

CREATE POLICY receipts_insert ON build_receipts
  FOR INSERT WITH CHECK (true);

CREATE POLICY receipts_read ON build_receipts
  FOR SELECT USING (true);

CREATE POLICY receipts_no_update ON build_receipts
  FOR UPDATE USING (false);

CREATE POLICY receipts_no_delete ON build_receipts
  FOR DELETE USING (false);

-- Public key policies (admin-only write)
CREATE POLICY keys_read ON truthserum_public_keys
  FOR SELECT USING (true);

CREATE POLICY keys_admin_write ON truthserum_public_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
