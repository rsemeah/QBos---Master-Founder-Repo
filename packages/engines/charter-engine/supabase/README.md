# CharterEngine™ - Database Schema

**Database schema for CharterEngine.**

## Tables

### charter_user_consents

```sql
CREATE TABLE charter_user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  consent_text TEXT NOT NULL,
  version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_charter_user_consents_type
    CHECK (consent_type IN ('terms_of_service', 'privacy_policy', 'cookie_consent', 'marketing', 'analytics', 'data_processing', 'third_party_sharing', 'custom'))
);

CREATE INDEX idx_charter_user_consents_user_id ON charter_user_consents(user_id);
CREATE INDEX idx_charter_user_consents_type ON charter_user_consents(consent_type);
CREATE INDEX idx_charter_user_consents_granted ON charter_user_consents(granted);
```

### charter_legal_documents

```sql
CREATE TABLE charter_legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  effective_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_consent BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_charter_legal_documents_type
    CHECK (type IN ('terms_of_service', 'privacy_policy', 'cookie_policy', 'acceptable_use', 'data_processing_agreement', 'custom'))
);

CREATE INDEX idx_charter_legal_documents_type ON charter_legal_documents(type);
CREATE INDEX idx_charter_legal_documents_version ON charter_legal_documents(version);
CREATE INDEX idx_charter_legal_documents_is_active ON charter_legal_documents(is_active);
```

### charter_data_export_requests

```sql
CREATE TABLE charter_data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  export_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_charter_data_export_requests_type
    CHECK (request_type IN ('export', 'deletion', 'rectification', 'restriction', 'portability')),
  CONSTRAINT chk_charter_data_export_requests_status
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_charter_data_export_requests_user_id ON charter_data_export_requests(user_id);
CREATE INDEX idx_charter_data_export_requests_status ON charter_data_export_requests(status);
```

### charter_retention_policies

```sql
CREATE TABLE charter_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL,
  retention_period_days INTEGER NOT NULL,
  auto_delete BOOLEAN NOT NULL DEFAULT false,
  archive_before_delete BOOLEAN NOT NULL DEFAULT true,
  legal_basis TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_charter_retention_policies_data_type ON charter_retention_policies(data_type);
CREATE INDEX idx_charter_retention_policies_is_active ON charter_retention_policies(is_active);
```

### charter_audit_logs

```sql
CREATE TABLE charter_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_charter_audit_logs_event_type
    CHECK (event_type IN ('consent_granted', 'consent_revoked', 'data_exported', 'data_deleted', 'data_rectified', 'policy_accepted', 'policy_updated', 'access_granted', 'access_revoked'))
);

CREATE INDEX idx_charter_audit_logs_user_id ON charter_audit_logs(user_id);
CREATE INDEX idx_charter_audit_logs_event_type ON charter_audit_logs(event_type);
CREATE INDEX idx_charter_audit_logs_timestamp ON charter_audit_logs(timestamp);
CREATE INDEX idx_charter_audit_logs_resource ON charter_audit_logs(resource_type, resource_id);
```

### charter_privacy_settings

```sql
CREATE TABLE charter_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  profile_visibility TEXT NOT NULL DEFAULT 'public',
  activity_visibility TEXT NOT NULL DEFAULT 'private',
  searchable BOOLEAN NOT NULL DEFAULT true,
  allow_analytics BOOLEAN NOT NULL DEFAULT false,
  allow_marketing BOOLEAN NOT NULL DEFAULT false,
  allow_third_party_sharing BOOLEAN NOT NULL DEFAULT false,
  data_retention_opt_out BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_charter_privacy_settings_profile_visibility
    CHECK (profile_visibility IN ('public', 'friends', 'private')),
  CONSTRAINT chk_charter_privacy_settings_activity_visibility
    CHECK (activity_visibility IN ('public', 'friends', 'private'))
);

CREATE INDEX idx_charter_privacy_settings_user_id ON charter_privacy_settings(user_id);
```

## Migration

See `packages/database/supabase/migrations/20251221120006_charter_engine_foundation.sql`
