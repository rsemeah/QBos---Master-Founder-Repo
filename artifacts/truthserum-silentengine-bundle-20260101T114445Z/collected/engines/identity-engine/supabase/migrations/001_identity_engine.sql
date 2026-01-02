-- IdentityEngine™ Database Schema
-- Users, Orgs, Memberships, Sessions, RBAC

CREATE TABLE IF NOT EXISTS identity_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES identity_orgs(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

CREATE TABLE IF NOT EXISTS identity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES identity_orgs(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES identity_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name)
);

-- Indexes
CREATE INDEX idx_identity_users_email ON identity_users(email);
CREATE INDEX idx_identity_memberships_user ON identity_memberships(user_id);
CREATE INDEX idx_identity_memberships_org ON identity_memberships(org_id);
CREATE INDEX idx_identity_sessions_token ON identity_sessions(token);
CREATE INDEX idx_identity_sessions_user ON identity_sessions(user_id);

-- RLS Policies
ALTER TABLE identity_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_roles ENABLE ROW LEVEL SECURITY;

-- Users can see themselves
CREATE POLICY identity_users_select ON identity_users
  FOR SELECT USING (auth.uid() = id);

-- Org members can see their org
CREATE POLICY identity_orgs_select ON identity_orgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM identity_memberships
      WHERE org_id = identity_orgs.id
      AND user_id = auth.uid()
    )
  );

-- Members can see memberships in their orgs
CREATE POLICY identity_memberships_select ON identity_memberships
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM identity_memberships m2
      WHERE m2.org_id = identity_memberships.org_id
      AND m2.user_id = auth.uid()
    )
  );

-- Users can see their own sessions
CREATE POLICY identity_sessions_select ON identity_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Cleanup expired sessions function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM identity_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
