# ConfigEngine™ - Database Schema

**Database schema for ConfigEngine.**

## Tables

### config_feature_flags

```sql
CREATE TABLE config_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 100,
  targeting JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_config_feature_flags_rollout
    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE INDEX idx_config_feature_flags_key ON config_feature_flags(key);
CREATE INDEX idx_config_feature_flags_enabled ON config_feature_flags(enabled);
```

### config_ab_tests

```sql
CREATE TABLE config_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  targeting JSONB DEFAULT '{}'::jsonb,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_config_ab_tests_status
    CHECK (status IN ('draft', 'running', 'paused', 'completed'))
);

CREATE INDEX idx_config_ab_tests_key ON config_ab_tests(key);
CREATE INDEX idx_config_ab_tests_status ON config_ab_tests(status);
```

### config_values

```sql
CREATE TABLE config_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  value_type TEXT NOT NULL,
  description TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_config_values_type
    CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'array'))
);

CREATE INDEX idx_config_values_key ON config_values(key);
CREATE INDEX idx_config_values_is_secret ON config_values(is_secret);
```

## RLS Policies

```sql
-- Feature flags: anyone can read, admins can write
ALTER TABLE config_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_feature_flags_select_all"
  ON config_feature_flags FOR SELECT
  USING (true);

CREATE POLICY "config_feature_flags_admin"
  ON config_feature_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );

-- A/B tests: similar to feature flags
ALTER TABLE config_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_ab_tests_select_all"
  ON config_ab_tests FOR SELECT
  USING (true);

CREATE POLICY "config_ab_tests_admin"
  ON config_ab_tests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );

-- Config values: authenticated can read non-secrets, admins can manage
ALTER TABLE config_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_values_select_nonsecret"
  ON config_values FOR SELECT
  USING (is_secret = false);

CREATE POLICY "config_values_admin"
  ON config_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );
```

## Migration

See `packages/database/supabase/migrations/20251221120001_config_engine_foundation.sql`
