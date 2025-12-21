# CharterEngine™

**Legal Compliance and Consent Management for QuietBuild OS**

CharterEngine™ provides comprehensive legal compliance capabilities including GDPR support, consent tracking, Terms of Service management, Privacy Policy handling, cookie consent, and data retention policies.

## Features

- **GDPR Compliance** - Data export, deletion, and rectification rights
- **Consent Management** - Track user consent for various purposes
- **Legal Documents** - Manage Terms of Service, Privacy Policies, and other legal documents
- **Cookie Consent** - Track and manage cookie preferences
- **Data Retention** - Define and enforce data retention policies
- **Audit Logging** - Complete audit trail for compliance
- **Privacy Settings** - User privacy preferences management

## Installation

```bash
pnpm install @qbos/charter-engine-core
```

## Quick Start

```typescript
import { CharterEngine } from '@qbos/charter-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const charterEngine = new CharterEngine({
  enabled: true,
  gdprEnabled: true,
  consentExpiryDays: 365,
  defaultRetentionDays: 2555,
  auditLogRetentionDays: 2555,
  requireExplicitConsent: true,
}, eventBus);

await charterEngine.init();
```

## Usage Examples

### Consent Management

```typescript
// Grant consent
await charterEngine.grantConsent({
  userId: 'user_123',
  consentType: 'privacy_policy',
  purpose: 'data_processing',
  version: '2.0',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

// Check consent
const hasConsent = await charterEngine.checkConsent(
  'user_123',
  'privacy_policy',
  'data_processing'
);

// Revoke consent
await charterEngine.revokeConsent({
  userId: 'user_123',
  consentType: 'marketing',
});
```

### GDPR Rights

```typescript
// Request data export
const exportRequest = await charterEngine.requestDataExport({
  userId: 'user_123',
  includeData: ['profile', 'posts', 'comments'],
  format: 'json',
});

// Request data deletion
const deletionRequest = await charterEngine.requestDataDeletion({
  userId: 'user_123',
  deleteAll: true,
});

// Check export status
const status = await charterEngine.getDataExportStatus(exportRequest.data!.id);
```

### Cookie Consent

```typescript
await charterEngine.updateCookieConsent({
  userId: 'user_123',
  preferences: {
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  },
});
```

### Privacy Settings

```typescript
await charterEngine.updatePrivacySettings('user_123', {
  profileVisibility: 'friends',
  activityVisibility: 'private',
  allowAnalytics: false,
  allowMarketing: false,
});
```

## Database Schema

See `packages/engines/charter-engine/supabase/README.md` for database schema documentation.

## License

MIT
