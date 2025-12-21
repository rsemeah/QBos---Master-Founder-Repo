# ContentEngine™ - Database Schema

**Database schema for ContentEngine.**

## Tables

### content

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL,
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  locale TEXT NOT NULL DEFAULT 'en',
  metadata JSONB DEFAULT '{}'::jsonb,
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured_image_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID,
  template_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_content_status
    CHECK (status IN ('draft', 'published', 'archived', 'scheduled', 'review'))
);

CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_author_id ON content(author_id);
CREATE INDEX idx_content_content_type_id ON content(content_type_id);
CREATE INDEX idx_content_tags ON content USING gin(tags);
CREATE INDEX idx_content_categories ON content USING gin(categories);
```

### content_versions

```sql
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  excerpt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  author_id UUID NOT NULL,
  change_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(content_id, version)
);

CREATE INDEX idx_content_versions_content_id ON content_versions(content_id);
```

### content_types

```sql
CREATE TABLE content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allow_versioning BOOLEAN NOT NULL DEFAULT true,
  requires_review BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_types_key ON content_types(key);
CREATE INDEX idx_content_types_is_active ON content_types(is_active);
```

### content_media_attachments

```sql
CREATE TABLE content_media_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  file_id UUID NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  alt_text TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_content_media_attachments_type
    CHECK (type IN ('image', 'video', 'audio', 'document', 'other'))
);

CREATE INDEX idx_content_media_attachments_content_id ON content_media_attachments(content_id);
```

## Migration

See `packages/database/supabase/migrations/20251221120007_content_engine_foundation.sql`
