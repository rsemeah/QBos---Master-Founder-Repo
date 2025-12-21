/**
 * @qbos/vault-engine-core - VaultEngine™ Core Package
 *
 * File storage and CDN integration for QuietBuild OS.
 */

// Main engine class
export { VaultEngine } from './vault.engine';
export type { VaultEngineConfig } from './vault.engine';

// All types
export type {
  // File types
  VaultFile,
  FileMetadata,
  StorageProvider,
  FileAccessLevel,

  // Upload types
  UploadFileParams,
  UploadFileResult,
  UploadMultipleParams,
  UploadMultipleResult,

  // Download types
  DownloadFileParams,
  DownloadFileResult,
  StreamFileParams,

  // Signed URL types
  GenerateSignedUrlParams,
  GenerateSignedUrlResult,
  GenerateUploadUrlParams,
  GenerateUploadUrlResult,

  // File management types
  UpdateFileParams,
  DeleteFileParams,
  GetFileParams,
  ListFilesParams,
  ListFilesResult,

  // Provider types
  StorageProviderConfig,
  ProviderCredentials,
  CreateStorageProviderParams,
  UpdateStorageProviderParams,

  // Access control types
  FilePermission,
  PermissionResourceType,
  GrantFileAccessParams,
  RevokeFileAccessParams,
  CheckFileAccessParams,
  CheckFileAccessResult,

  // CDN types
  CDNConfig,
  CDNProvider,
  CDNProviderConfig,
  PurgeCDNParams,
  PurgeCDNResult,

  // Result types
  VaultEngineResult,
  VaultEngineError,

  // Event payload types
  FileUploadedEvent,
  FileDownloadedEvent,
  FileDeletedEvent,
  FileUpdatedEvent,
  SignedUrlGeneratedEvent,
  FileAccessGrantedEvent,
  FileAccessRevokedEvent,
  StorageProviderCreatedEvent,
  StorageProviderUpdatedEvent,
} from './types';
