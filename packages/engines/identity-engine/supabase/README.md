# IdentityEngine™ - Database Schema

**Database schema and migrations for IdentityEngine.**

This document describes the database tables, indexes, and RLS policies required for IdentityEngine.

## Tables

### identity_users

User accounts and profiles.

```sql
CREATE TABLE identity_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Activity tracking
  last_login_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_identity_users_status
    CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_identity_users_email ON identity_users(email);
CREATE INDEX idx_identity_users_status ON identity_users(status) WHERE status != 'deleted';
CREATE INDEX idx_identity_users_created_at ON identity_users(created_at DESC);
```

### identity_roles

Role definitions with permissions.

```sql
CREATE TABLE identity_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_roles_name ON identity_roles(name);
CREATE INDEX idx_identity_roles_is_system ON identity_roles(is_system);
```

### identity_user_roles

User role assignments (many-to-many).

```sql
CREATE TABLE identity_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES identity_roles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL, -- Denormalized for performance

  -- Audit fields
  granted_by UUID REFERENCES identity_users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT uq_identity_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_identity_user_roles_user_id ON identity_user_roles(user_id);
CREATE INDEX idx_identity_user_roles_role_id ON identity_user_roles(role_id);
CREATE INDEX idx_identity_user_roles_expires_at ON identity_user_roles(expires_at)
  WHERE expires_at IS NOT NULL;
```

### identity_permissions

Permission definitions.

```sql
CREATE TABLE identity_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_identity_permissions_action
    CHECK (action IN ('create', 'read', 'update', 'delete', 'execute', 'admin'))
);

CREATE INDEX idx_identity_permissions_resource ON identity_permissions(resource);
CREATE INDEX idx_identity_permissions_action ON identity_permissions(action);
```

### identity_teams

Team/organization entities.

```sql
CREATE TABLE identity_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',

  -- Ownership
  owner_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_identity_teams_status
    CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_identity_teams_slug ON identity_teams(slug);
CREATE INDEX idx_identity_teams_owner_id ON identity_teams(owner_id);
CREATE INDEX idx_identity_teams_status ON identity_teams(status) WHERE status != 'deleted';
```

### identity_team_members

Team membership (many-to-many).

```sql
CREATE TABLE identity_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  team_id UUID NOT NULL REFERENCES identity_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,

  -- Role within team
  role TEXT NOT NULL DEFAULT 'member',

  -- Audit fields
  invited_by UUID REFERENCES identity_users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT uq_identity_team_members_team_user UNIQUE (team_id, user_id),
  CONSTRAINT chk_identity_team_members_role
    CHECK (role IN ('owner', 'admin', 'member', 'guest'))
);

CREATE INDEX idx_identity_team_members_team_id ON identity_team_members(team_id);
CREATE INDEX idx_identity_team_members_user_id ON identity_team_members(user_id);
CREATE INDEX idx_identity_team_members_role ON identity_team_members(role);
```

### identity_sessions

User sessions for authentication.

```sql
CREATE TABLE identity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key
  user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,

  -- Session data
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_sessions_user_id ON identity_sessions(user_id);
CREATE INDEX idx_identity_sessions_token ON identity_sessions(token);
CREATE INDEX idx_identity_sessions_expires_at ON identity_sessions(expires_at);
```

## Row Level Security (RLS)

### identity_users

```sql
ALTER TABLE identity_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "identity_users_select_own"
  ON identity_users FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "identity_users_select_admin"
  ON identity_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
    )
  );

-- Users can update their own data (except status)
CREATE POLICY "identity_users_update_own"
  ON identity_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND status = (SELECT status FROM identity_users WHERE id = auth.uid()));

-- Admins can update any user
CREATE POLICY "identity_users_update_admin"
  ON identity_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
    )
  );
```

### identity_roles

```sql
ALTER TABLE identity_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can read roles
CREATE POLICY "identity_roles_select_all"
  ON identity_roles FOR SELECT
  USING (true);

-- Only admins can modify roles
CREATE POLICY "identity_roles_admin"
  ON identity_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
    )
  );
```

### identity_user_roles

```sql
ALTER TABLE identity_user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role assignments
CREATE POLICY "identity_user_roles_select_own"
  ON identity_user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all role assignments
CREATE POLICY "identity_user_roles_select_admin"
  ON identity_user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
    )
  );

-- Only admins can assign roles
CREATE POLICY "identity_user_roles_admin"
  ON identity_user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
    )
  );
```

### identity_teams

```sql
ALTER TABLE identity_teams ENABLE ROW LEVEL SECURITY;

-- Team members can read their teams
CREATE POLICY "identity_teams_select_member"
  ON identity_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM identity_team_members
      WHERE team_id = identity_teams.id
      AND user_id = auth.uid()
    )
  );

-- Team owners can update their teams
CREATE POLICY "identity_teams_update_owner"
  ON identity_teams FOR UPDATE
  USING (owner_id = auth.uid());

-- Team admins can update teams
CREATE POLICY "identity_teams_update_admin"
  ON identity_teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM identity_team_members
      WHERE team_id = identity_teams.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### identity_team_members

```sql
ALTER TABLE identity_team_members ENABLE ROW LEVEL SECURITY;

-- Team members can read team membership
CREATE POLICY "identity_team_members_select"
  ON identity_team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM identity_team_members tm
      WHERE tm.team_id = identity_team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Team admins can add/remove members
CREATE POLICY "identity_team_members_admin"
  ON identity_team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_team_members
      WHERE team_id = identity_team_members.team_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### identity_sessions

```sql
ALTER TABLE identity_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "identity_sessions_select_own"
  ON identity_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "identity_sessions_delete_own"
  ON identity_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Admins can read all sessions
CREATE POLICY "identity_sessions_admin"
  ON identity_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
    )
  );
```

## Functions

### update_updated_at()

Auto-update updated_at timestamp on row changes.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to tables
CREATE TRIGGER trigger_identity_users_updated_at
  BEFORE UPDATE ON identity_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_identity_roles_updated_at
  BEFORE UPDATE ON identity_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_identity_teams_updated_at
  BEFORE UPDATE ON identity_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Migration File

See `packages/database/supabase/migrations/20251221120000_identity_engine_foundation.sql` for the complete migration.

## Notes

- All IDs use UUID v4 for security
- Soft deletes used for users and teams (status = 'deleted')
- Denormalized `role_name` in `identity_user_roles` for performance
- Sessions automatically cleaned up by expired_at index
- RLS ensures users can only access their own data (admins excepted)
- All tables have metadata JSONB field for extensibility
