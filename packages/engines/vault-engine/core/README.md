# VaultEngine™

**File Storage and CDN Integration for QuietBuild OS**

VaultEngine™ provides comprehensive file storage capabilities with multi-provider support (S3, GCS, Azure, Supabase Storage), CDN integration, signed URL generation, and advanced access control.

## Features

- **Multi-Provider Support** - S3, Google Cloud Storage, Azure Blob, Supabase Storage, local storage
- **CDN Integration** - CloudFlare, CloudFront, Fastly integration for fast delivery
- **Signed URLs** - Generate time-limited secure URLs for uploads and downloads
- **Access Control** - Fine-grained permissions for users, teams, and roles
- **Metadata Tracking** - Store and search file metadata
- **Automatic Thumbnails** - Generate thumbnails for images
- **Event-Driven** - Emits events for all file operations
- **Product-Agnostic** - Generic storage layer

## Installation

```bash
pnpm install @qbos/vault-engine-core
```

## Quick Start

### 1. Basic Setup

```typescript
import { VaultEngine } from '@qbos/vault-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const vaultEngine = new VaultEngine({
  enabled: true,
  defaultProvider: 's3',
  defaultBucket: 'my-app-files',
  maxFileSizeBytes: 104857600, // 100MB
  enableCDN: true,
  enableAccessControl: true,
}, eventBus);

await vaultEngine.init();
```

### 2. Upload Files

```typescript
// Upload from buffer
const result = await vaultEngine.uploadFile({
  file: fileBuffer,
  filename: 'avatar.jpg',
  mimeType: 'image/jpeg',
  isPublic: true,
  uploaderId: userId,
  metadata: {
    originalName: 'john-avatar.jpg',
    source: 'profile-upload',
  },
  tags: ['avatar', 'profile'],
});

if (result.ok) {
  console.log('File uploaded:', result.data!.url);
  console.log('CDN URL:', result.data!.cdnUrl);
}

// Upload multiple files
const multipleResult = await vaultEngine.uploadMultiple({
  files: [
    { file: buffer1, filename: 'file1.pdf' },
    { file: buffer2, filename: 'file2.pdf' },
  ],
  folder: 'documents',
  uploaderId: userId,
});

console.log(`Uploaded: ${multipleResult.data!.successful}/${multipleResult.data!.files.length}`);
```

### 3. Download Files

```typescript
// Download by file ID
const download = await vaultEngine.downloadFile({
  fileId: 'file_123',
});

if (download.ok) {
  const fileContent = download.data!.content;
  const contentType = download.data!.contentType;
}

// Download by key
const downloadByKey = await vaultEngine.downloadFile({
  key: '1234567890_abc_document.pdf',
});
```

### 4. Generate Signed URLs

```typescript
// Generate signed download URL
const signedUrl = await vaultEngine.generateSignedUrl({
  fileId: 'file_123',
  expiresInSeconds: 3600, // 1 hour
});

if (signedUrl.ok) {
  console.log('Download URL:', signedUrl.data!.url);
  console.log('Expires at:', signedUrl.data!.expiresAt);
}

// Generate signed upload URL
const uploadUrl = await vaultEngine.generateUploadUrl({
  filename: 'document.pdf',
  folder: 'uploads',
  expiresInSeconds: 600, // 10 minutes
  maxSizeBytes: 10485760, // 10MB
});

if (uploadUrl.ok) {
  // Client can upload directly to this URL
  console.log('Upload to:', uploadUrl.data!.uploadUrl);
}
```

### 5. File Management

```typescript
// Get file metadata
const file = await vaultEngine.getFile({
  fileId: 'file_123',
});

// Update file
await vaultEngine.updateFile('file_123', {
  filename: 'renamed-document.pdf',
  isPublic: false,
  tags: ['important', 'contracts'],
  metadata: {
    category: 'legal',
  },
});

// Delete file
await vaultEngine.deleteFile({
  fileId: 'file_123',
  permanent: true, // Also delete from storage provider
});

// List files
const files = await vaultEngine.listFiles({
  folder: 'documents',
  uploaderId: userId,
  tags: ['contracts'],
  limit: 50,
  offset: 0,
});
```

## Storage Providers

### Configure S3

```typescript
await vaultEngine.createStorageProvider({
  name: 'AWS S3',
  provider: 's3',
  config: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
  },
  defaultBucket: 'my-app-files',
  cdnEnabled: true,
  cdnDomain: 'cdn.myapp.com',
  isDefault: true,
});
```

### Configure Google Cloud Storage

```typescript
await vaultEngine.createStorageProvider({
  name: 'Google Cloud Storage',
  provider: 'gcs',
  config: {
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: './gcp-key.json',
  },
  defaultBucket: 'my-app-files',
  cdnEnabled: true,
  isDefault: false,
});
```

### Configure Supabase Storage

```typescript
await vaultEngine.createStorageProvider({
  name: 'Supabase Storage',
  provider: 'supabase',
  config: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  defaultBucket: 'files',
  cdnEnabled: true,
  isDefault: false,
});
```

## Access Control

### Grant Access to Users

```typescript
// Grant user access to file
await vaultEngine.grantFileAccess({
  fileId: 'file_123',
  resourceType: 'user',
  resourceId: 'user_456',
  accessLevel: 'private',
  expiresAt: '2024-12-31T23:59:59Z',
});

// Grant team access
await vaultEngine.grantFileAccess({
  fileId: 'file_123',
  resourceType: 'team',
  resourceId: 'team_789',
  accessLevel: 'authenticated',
});
```

### Check Access

```typescript
const access = await vaultEngine.checkFileAccess({
  fileId: 'file_123',
  userId: 'user_456',
  teamId: 'team_789',
});

if (access.ok && access.data!.hasAccess) {
  console.log('Access level:', access.data!.accessLevel);
  console.log('Reason:', access.data!.reason);
}
```

### Revoke Access

```typescript
await vaultEngine.revokeFileAccess({
  fileId: 'file_123',
  resourceType: 'user',
  resourceId: 'user_456',
});
```

## CDN Operations

### Purge CDN Cache

```typescript
// Purge specific files
await vaultEngine.purgeCDN({
  fileIds: ['file_123', 'file_456'],
});

// Purge by keys
await vaultEngine.purgeCDN({
  keys: ['1234567890_abc_image.jpg'],
});

// Purge by paths
await vaultEngine.purgeCDN({
  paths: ['/images/*', '/documents/contracts/*'],
});
```

## Configuration

### VaultEngineConfig

```typescript
interface VaultEngineConfig {
  enabled: boolean;                   // Enable/disable engine (default: true)
  defaultProvider: string;            // Default storage provider (default: 's3')
  defaultBucket: string;              // Default bucket (default: 'default')
  maxFileSizeBytes: number;           // Max file size (default: 100MB)
  allowedMimeTypes: string[];         // Allowed MIME types (default: [])
  autoGenerateThumbnails: boolean;    // Auto thumbnails (default: true)
  enableCDN: boolean;                 // Enable CDN (default: true)
  signedUrlExpirySeconds: number;     // Signed URL TTL (default: 3600)
  enableAccessControl: boolean;       // Enable ACL (default: true)
}
```

## Events

### Events Emitted

- **`vault.file.uploaded`** - File uploaded
- **`vault.file.downloaded`** - File downloaded
- **`vault.file.deleted`** - File deleted
- **`vault.file.updated`** - File metadata updated
- **`vault.signed_url.generated`** - Signed URL generated
- **`vault.access.granted`** - File access granted
- **`vault.access.revoked`** - File access revoked
- **`vault.provider.created`** - Storage provider created
- **`vault.provider.updated`** - Storage provider updated

### Subscribing to Events

```typescript
eventBus.on('vault.file.uploaded', async (event) => {
  console.log(`File uploaded: ${event.filename}`);
  console.log(`Size: ${event.size} bytes`);

  // Generate thumbnail for images
  if (event.mimeType.startsWith('image/')) {
    await thumbnailService.generate(event.fileId);
  }
});
```

## API Reference

### File Operations
- `uploadFile(params)` - Upload single file
- `uploadMultiple(params)` - Upload multiple files
- `downloadFile(params)` - Download file
- `getFile(params)` - Get file metadata
- `updateFile(fileId, params)` - Update file
- `deleteFile(params)` - Delete file
- `listFiles(params)` - List files

### Signed URLs
- `generateSignedUrl(params)` - Generate signed download URL
- `generateUploadUrl(params)` - Generate signed upload URL

### Provider Management
- `createStorageProvider(params)` - Create provider
- `updateStorageProvider(providerId, params)` - Update provider

### Access Control
- `grantFileAccess(params)` - Grant access
- `revokeFileAccess(params)` - Revoke access
- `checkFileAccess(params)` - Check access

### CDN Operations
- `purgeCDN(params)` - Purge CDN cache

## Best Practices

### 1. Use Signed URLs for Uploads

```typescript
// Generate signed upload URL for client
const uploadUrl = await vaultEngine.generateUploadUrl({
  filename: file.name,
  folder: 'user-uploads',
  expiresInSeconds: 300,
  maxSizeBytes: 10485760,
});

// Client uploads directly to storage
await fetch(uploadUrl.data!.uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});
```

### 2. Organize Files with Folders and Tags

```typescript
await vaultEngine.uploadFile({
  file: buffer,
  filename: 'contract.pdf',
  folder: 'legal/contracts/2024',
  tags: ['contract', 'signed', 'legal'],
  metadata: {
    contractId: 'CONTRACT-2024-001',
    signedDate: '2024-01-15',
  },
});
```

### 3. Use CDN for Public Assets

```typescript
await vaultEngine.createStorageProvider({
  name: 'Primary Storage',
  provider: 's3',
  cdnEnabled: true,
  cdnDomain: 'cdn.myapp.com',
  isDefault: true,
});

// Public files automatically use CDN
const result = await vaultEngine.uploadFile({
  file: logoBuffer,
  filename: 'logo.png',
  isPublic: true,
});

console.log('CDN URL:', result.data!.cdnUrl);
```

## Database Schema

See `packages/engines/vault-engine/supabase/README.md` for database schema documentation.

## License

MIT
