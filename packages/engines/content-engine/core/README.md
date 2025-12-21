# ContentEngine™

**CMS and Content Versioning for QuietBuild OS**

ContentEngine™ provides comprehensive content management capabilities with versioning, draft/published workflow, custom content types, rich metadata, search, and media attachments.

## Features

- **Content Management** - Create, update, delete, and publish content
- **Content Versioning** - Full version history with restore capability
- **Custom Content Types** - Define schemas and fields for different content types
- **Draft/Published Workflow** - Content approval and scheduling
- **Rich Metadata** - SEO metadata, tags, categories
- **Content Search** - Full-text search across all content
- **Media Attachments** - Attach images, videos, documents to content
- **Content Permissions** - Fine-grained access control

## Installation

```bash
pnpm install @qbos/content-engine-core
```

## Quick Start

```typescript
import { ContentEngine } from '@qbos/content-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const contentEngine = new ContentEngine({
  enabled: true,
  enableVersioning: true,
  maxVersionsPerContent: 100,
  enableSearch: true,
  enableWorkflow: true,
  defaultLocale: 'en',
}, eventBus);

await contentEngine.init();
```

## Usage Examples

### Create Content

```typescript
const article = await contentEngine.createContent({
  contentTypeId: 'article',
  slug: 'my-first-post',
  title: 'My First Post',
  body: 'This is the content...',
  excerpt: 'A short summary',
  status: 'draft',
  authorId: 'user_123',
  tags: ['tech', 'tutorial'],
  categories: ['blog'],
  seoMetadata: {
    metaTitle: 'My First Post - Blog',
    metaDescription: 'Learn how to...',
  },
});
```

### Publish Content

```typescript
await contentEngine.publishContent(article.data!.id);
```

### Create Content Type

```typescript
await contentEngine.createContentType({
  key: 'article',
  name: 'Article',
  schema: {
    version: '1.0',
    properties: {
      title: { type: 'string' },
      body: { type: 'rich_text' },
    },
  },
  fields: [
    {
      name: 'Title',
      key: 'title',
      type: 'text',
      required: true,
      validation: { maxLength: 200 },
      options: {},
      order: 0,
    },
  ],
  allowVersioning: true,
});
```

### Search Content

```typescript
const results = await contentEngine.searchContent({
  query: 'tutorial',
  tags: ['tech'],
  limit: 20,
});
```

## Database Schema

See `packages/engines/content-engine/supabase/README.md` for database schema documentation.

## License

MIT
