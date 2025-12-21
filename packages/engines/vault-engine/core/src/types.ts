/**
 * VaultEngine Types
 *
 * Complete type definitions for the VaultEngine.
 * File storage and CDN integration.
 */

// =============================================================================
// FILE TYPES
// =============================================================================

export interface VaultFile {
  id: string;
  key: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  storageProvider: StorageProvider;
  storagePath: string;
  bucket: string;
  url: string | null;
  cdnUrl: string | null;
  uploaderId: string | null;
  isPublic: boolean;
  metadata: FileMetadata;
  tags: string[];
  checksum: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  encoding?: string;
  bitrate?: number;
  [key: string]: any;
}

export type StorageProvider = 's3' | 'gcs' | 'azure' | 'supabase' | 'local' | 'custom';

export type FileAccessLevel = 'public' | 'private' | 'authenticated' | 'custom';

// =============================================================================
// UPLOAD TYPES
// =============================================================================

export interface UploadFileParams {
  file: Buffer | string;
  filename: string;
  mimeType?: string;
  bucket?: string;
  folder?: string;
  isPublic?: boolean;
  uploaderId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  expiresAt?: string;
}

export interface UploadFileResult {
  file: VaultFile;
  url: string;
  cdnUrl: string | null;
}

export interface UploadMultipleParams {
  files: Array<{
    file: Buffer | string;
    filename: string;
    mimeType?: string;
  }>;
  bucket?: string;
  folder?: string;
  isPublic?: boolean;
  uploaderId?: string;
  metadata?: Record<string, any>;
}

export interface UploadMultipleResult {
  files: VaultFile[];
  successful: number;
  failed: number;
  errors: Array<{ filename: string; error: string }>;
}

// =============================================================================
// DOWNLOAD TYPES
// =============================================================================

export interface DownloadFileParams {
  fileId?: string;
  key?: string;
}

export interface DownloadFileResult {
  file: VaultFile;
  content: Buffer;
  contentType: string;
}

export interface StreamFileParams {
  fileId?: string;
  key?: string;
  range?: {
    start: number;
    end: number;
  };
}

// =============================================================================
// SIGNED URL TYPES
// =============================================================================

export interface GenerateSignedUrlParams {
  fileId?: string;
  key?: string;
  expiresInSeconds?: number;
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface GenerateSignedUrlResult {
  url: string;
  expiresAt: string;
}

export interface GenerateUploadUrlParams {
  filename: string;
  mimeType?: string;
  bucket?: string;
  folder?: string;
  expiresInSeconds?: number;
  maxSizeBytes?: number;
}

export interface GenerateUploadUrlResult {
  uploadUrl: string;
  fileKey: string;
  expiresAt: string;
}

// =============================================================================
// FILE MANAGEMENT TYPES
// =============================================================================

export interface UpdateFileParams {
  filename?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  expiresAt?: string;
}

export interface DeleteFileParams {
  fileId?: string;
  key?: string;
  permanent?: boolean;
}

export interface GetFileParams {
  fileId?: string;
  key?: string;
}

export interface ListFilesParams {
  bucket?: string;
  folder?: string;
  uploaderId?: string;
  tags?: string[];
  mimeType?: string;
  limit?: number;
  offset?: number;
}

export interface ListFilesResult {
  files: VaultFile[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// STORAGE PROVIDER TYPES
// =============================================================================

export interface StorageProviderConfig {
  id: string;
  name: string;
  provider: StorageProvider;
  config: ProviderCredentials;
  defaultBucket: string;
  cdnEnabled: boolean;
  cdnDomain: string | null;
  isActive: boolean;
  isDefault: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  endpoint?: string;
  projectId?: string;
  accountName?: string;
  accountKey?: string;
  [key: string]: any;
}

export interface CreateStorageProviderParams {
  name: string;
  provider: StorageProvider;
  config: ProviderCredentials;
  defaultBucket: string;
  cdnEnabled?: boolean;
  cdnDomain?: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateStorageProviderParams {
  name?: string;
  config?: ProviderCredentials;
  defaultBucket?: string;
  cdnEnabled?: boolean;
  cdnDomain?: string;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

// =============================================================================
// ACCESS CONTROL TYPES
// =============================================================================

export interface FilePermission {
  id: string;
  fileId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  accessLevel: FileAccessLevel;
  expiresAt: string | null;
  createdAt: string;
}

export type PermissionResourceType = 'user' | 'team' | 'role' | 'public';

export interface GrantFileAccessParams {
  fileId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  accessLevel: FileAccessLevel;
  expiresAt?: string;
}

export interface RevokeFileAccessParams {
  fileId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
}

export interface CheckFileAccessParams {
  fileId: string;
  userId: string;
  teamId?: string;
}

export interface CheckFileAccessResult {
  hasAccess: boolean;
  accessLevel: FileAccessLevel | null;
  reason: string;
}

// =============================================================================
// CDN TYPES
// =============================================================================

export interface CDNConfig {
  enabled: boolean;
  domain: string;
  provider: CDNProvider;
  config: CDNProviderConfig;
  cacheControlMaxAge: number;
}

export type CDNProvider = 'cloudflare' | 'cloudfront' | 'fastly' | 'custom';

export interface CDNProviderConfig {
  apiKey?: string;
  distributionId?: string;
  zone?: string;
  [key: string]: any;
}

export interface PurgeCDNParams {
  fileIds?: string[];
  keys?: string[];
  paths?: string[];
}

export interface PurgeCDNResult {
  purged: number;
  failed: number;
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

export interface VaultEngineConfig {
  enabled: boolean;
  defaultProvider: string;
  defaultBucket: string;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  autoGenerateThumbnails: boolean;
  enableCDN: boolean;
  signedUrlExpirySeconds: number;
  enableAccessControl: boolean;
}

// =============================================================================
// ENGINE RESULT TYPES
// =============================================================================

export interface VaultEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: VaultEngineError;
}

export interface VaultEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// =============================================================================
// EVENT PAYLOAD TYPES
// =============================================================================

export interface FileUploadedEvent {
  fileId: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  uploaderId: string | null;
  isPublic: boolean;
  timestamp: string;
}

export interface FileDownloadedEvent {
  fileId: string;
  key: string;
  filename: string;
  downloaderId: string | null;
  timestamp: string;
}

export interface FileDeletedEvent {
  fileId: string;
  key: string;
  filename: string;
  deletedBy: string | null;
  permanent: boolean;
  timestamp: string;
}

export interface FileUpdatedEvent {
  fileId: string;
  key: string;
  changes: Partial<UpdateFileParams>;
  timestamp: string;
}

export interface SignedUrlGeneratedEvent {
  fileId: string;
  key: string;
  expiresAt: string;
  requesterId: string | null;
  timestamp: string;
}

export interface FileAccessGrantedEvent {
  fileId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  accessLevel: FileAccessLevel;
  grantedBy: string | null;
  timestamp: string;
}

export interface FileAccessRevokedEvent {
  fileId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  revokedBy: string | null;
  timestamp: string;
}

export interface StorageProviderCreatedEvent {
  providerId: string;
  providerName: string;
  provider: StorageProvider;
  timestamp: string;
}

export interface StorageProviderUpdatedEvent {
  providerId: string;
  providerName: string;
  changes: Partial<UpdateStorageProviderParams>;
  timestamp: string;
}
