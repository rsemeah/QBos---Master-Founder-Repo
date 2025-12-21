/**
 * @qbos/charter-engine-core - CharterEngine™ Core Package
 *
 * Legal compliance and consent management for QuietBuild OS.
 */

// Main engine class
export { CharterEngine } from './charter.engine';
export type { CharterEngineConfig } from './charter.engine';

// All types
export type {
  // Consent types
  UserConsent,
  ConsentType,
  GrantConsentParams,
  RevokeConsentParams,
  GetConsentParams,
  ConsentStatus,

  // Legal document types
  LegalDocument,
  DocumentType,
  CreateLegalDocumentParams,
  UpdateLegalDocumentParams,
  GetLegalDocumentParams,

  // GDPR types
  DataExportRequest,
  DataRequestType,
  DataRequestStatus,
  RequestDataExportParams,
  RequestDataDeletionParams,
  DataExportResult,

  // Retention types
  DataRetentionPolicy,
  CreateRetentionPolicyParams,
  UpdateRetentionPolicyParams,

  // Audit log types
  ComplianceAuditLog,
  AuditEventType,
  LogAuditEventParams,
  GetAuditLogParams,
  AuditLogResult,

  // Cookie consent types
  CookieConsent,
  CookiePreferences,
  UpdateCookieConsentParams,

  // Privacy settings types
  PrivacySettings,
  VisibilityLevel,
  UpdatePrivacySettingsParams,

  // Result types
  CharterEngineResult,
  CharterEngineError,

  // Event payload types
  ConsentGrantedEvent,
  ConsentRevokedEvent,
  DataExportedEvent,
  DataDeletedEvent,
  LegalDocumentCreatedEvent,
  LegalDocumentUpdatedEvent,
  PolicyAcceptedEvent,
  PrivacySettingsUpdatedEvent,
} from './types';
