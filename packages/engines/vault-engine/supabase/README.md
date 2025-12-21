# VaultEngine™ - Database Schema

**Database schema for VaultEngine.**

## Tables

### vault_files

```sql
CREATE TABLE vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  storage_provider TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  bucket TEXT NOT NULL,
  url TEXT,
  cdn_url TEXT,
  uploader_id UUID,
  is_public BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  checksum TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_vault_files_storage_provider
    CHECK (storage_provider IN ('s3', 'gcs', 'azure', 'supabase', 'local', 'custom'))
);

CREATE INDEX idx_vault_files_key ON vault_files(key);
CREATE INDEX idx_vault_files_uploader_id ON vault_files(uploader_id);
CREATE INDEX idx_vault_files_mime_type ON vault_files(mime_type);
CREATE INDEX idx_vault_files_tags ON vault_files USING gin(tags);
CREATE INDEX idx_vault_files_created_at ON vault_files(created_at);
CREATE INDEX idx_vault_files_bucket ON vault_files(bucket);
```

### vault_storage_providers

```sql
CREATE TABLE vault_storage_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_bucket TEXT NOT NULL,
  cdn_enabled BOOLEAN NOT NULL DEFAULT false,
  cdn_domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_vault_storage_providers_provider
    CHECK (provider IN ('s3', 'gcs', 'azure', 'supabase', 'local', 'custom'))
);

CREATE INDEX idx_vault_storage_providers_is_default ON vault_storage_providers(is_default);
CREATE INDEX idx_vault_storage_providers_is_active ON vault_storage_providers(is_active);
```

### vault_file_permissions

```sql
CREATE TABLE vault_file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES vault_files(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  access_level TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_vault_file_permissions_resource_type
    CHECK (resource_type IN ('user', 'team', 'role', 'public')),
  CONSTRAINT chk_vault_file_permissions_access_level
    CHECK (access_level IN ('public', 'private', 'authenticated', 'custom')),
  UNIQUE(file_id, resource_type, resource_id)
);

CREATE INDEX idx_vault_file_permissions_file_id ON vault_file_permissions(file_id);
CREATE INDEX idx_vault_file_permissions_resource ON vault_file_permissions(resource_type, resource_id);
```

## RLS Policies

```sql
-- Files: users can view their own and public files
ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_files_select_public"
  ON vault_files FOR SELECT
  USING (is_public = true);

CREATE POLICY "vault_files_select_own"
  ON vault_files FOR SELECT
  USING (uploader_id = auth.uid());

CREATE POLICY "vault_files_insert_authenticated"
  ON vault_files FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "vault_files_update_own"
  ON vault_files FOR UPDATE
  USING (uploader_id = auth.uid());

CREATE POLICY "vault_files_delete_own"
  ON vault_files FOR DELETE
  USING (uploader_id = auth.uid());

-- Storage providers: admin only
ALTER TABLE vault_storage_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_storage_providers_admin"
  ON vault_storage_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );

-- File permissions: admin and file owner can manage
ALTER TABLE vault_file_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_file_permissions_select"
  ON vault_file_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vault_files
      WHERE vault_files.id = vault_file_permissions.file_id
        AND vault_files.uploader_id = auth.uid()
    )
  );

CREATE POLICY "vault_file_permissions_manage_own"
  ON vault_file_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vault_files
      WHERE vault_files.id = vault_file_permissions.file_id
        AND vault_files.uploader_id = auth.uid()
    )
  );
```

## Migration

See `packages/database/supabase/migrations/20251221120005_vault_engine_foundation.sql`
