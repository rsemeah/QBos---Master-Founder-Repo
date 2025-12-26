-- Identity Engine™ Migration
-- Organizations, Memberships, and Role-Based Access Control

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for org lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Roles Table (predefined roles)
-- ================================================================
-- IdentityEngine tables
-- ================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions Table (granular permissions)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL, -- e.g., 'build_sessions', 'templates', 'organizations'
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Index for permission lookups
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- User Roles Table (assigns roles to users globally or per org)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role_id, org_id)
);

-- Index for user role lookups
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_org ON user_roles(org_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- Organization Memberships Table
CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Index for membership lookups
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON org_memberships(org_id);
CREATE INDEX idx_org_memberships_role ON org_memberships(role);

-- User Sessions Table (beyond Supabase Auth - app-level sessions)
CREATE TABLE IF NOT EXISTS identity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for session lookups
CREATE INDEX idx_identity_sessions_token ON identity_sessions(token);
CREATE INDEX idx_identity_sessions_user ON identity_sessions(user_id);
CREATE INDEX idx_identity_sessions_expires_at ON identity_sessions(expires_at);

-- Row Level Security Policies

-- Organizations RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organizations they are members of"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
        AND org_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Org owners can update their organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
        AND org_memberships.user_id = auth.uid()
        AND org_memberships.role = 'owner'
    )
  );

-- Roles RLS (read-only for authenticated users)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Permissions RLS (read-only for authenticated users)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- User Roles RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Org admins can manage roles in their org"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = user_roles.org_id
        AND org_memberships.user_id = auth.uid()
        AND org_memberships.role IN ('owner', 'admin')
    )
  );

-- Org Memberships RLS
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memberships of their organizations"
  ON org_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships AS om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners and admins can manage memberships"
  ON org_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships AS om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Identity Sessions RLS
ALTER TABLE identity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON identity_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
  ON identity_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON identity_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Helper Functions

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT,
  p_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Check if user has a role with this permission
  SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    JOIN permissions p ON p.id = ANY(
      SELECT jsonb_array_elements_text(r.permissions)::UUID
    )
    WHERE ur.user_id = p_user_id
      AND (ur.org_id = p_org_id OR ur.org_id IS NULL)
      AND p.resource = p_resource
      AND p.action = p_action
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user organizations
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  role TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    om.role,
    om.joined_at
  FROM organizations o
  JOIN org_memberships om ON om.org_id = o.id
  WHERE om.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_memberships_updated_at
  BEFORE UPDATE ON org_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '[]'::jsonb),
  ('developer', 'Can create and manage builds', '[]'::jsonb),
  ('viewer', 'Read-only access', '[]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Seed default permissions
INSERT INTO permissions (resource, action, description) VALUES
  ('build_sessions', 'create', 'Create new build sessions'),
  ('build_sessions', 'read', 'View build sessions'),
  ('build_sessions', 'update', 'Update build sessions'),
  ('build_sessions', 'delete', 'Delete build sessions'),
  ('organizations', 'create', 'Create organizations'),
  ('organizations', 'read', 'View organizations'),
  ('organizations', 'update', 'Update organizations'),
  ('organizations', 'delete', 'Delete organizations'),
  ('organizations', 'manage', 'Full organization management')
ON CONFLICT (resource, action) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON org_memberships TO authenticated;
GRANT SELECT, INSERT, DELETE ON identity_sessions TO authenticated;
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT role_name_nonempty CHECK (length(name) > 0)
);

CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT permission_name_nonempty CHECK (length(name) > 0)
);

CREATE TRIGGER set_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_select_authenticated
  ON roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY permissions_select_authenticated
  ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY role_permissions_select_authenticated
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY user_roles_select_own
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY user_roles_insert_own
  ON user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_roles_update_own
  ON user_roles FOR UPDATE
  USING (user_id = auth.uid());
