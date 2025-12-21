/**
 * CharterEngine Types
 *
 * Complete type definitions for the CharterEngine.
 * Legal compliance and consent management (GDPR, privacy, terms).
 */

// =============================================================================
// CONSENT TYPES
// =============================================================================

export interface UserConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  consentText: string;
  version: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any>;
  grantedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'cookie_consent'
  | 'marketing'
  | 'analytics'
  | 'data_processing'
  | 'third_party_sharing'
  | 'custom';

export interface GrantConsentParams {
  userId: string;
  consentType: ConsentType;
  purpose: string;
  version?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface RevokeConsentParams {
  userId: string;
  consentType: ConsentType;
  purpose?: string;
}

export interface GetConsentParams {
  userId: string;
  consentType?: ConsentType;
  purpose?: string;
}

export interface ConsentStatus {
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

// =============================================================================
// LEGAL DOCUMENT TYPES
// =============================================================================

export interface LegalDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  version: string;
  language: string;
  effectiveDate: string;
  expiryDate: string | null;
  isActive: boolean;
  requiresConsent: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'cookie_policy'
  | 'acceptable_use'
  | 'data_processing_agreement'
  | 'custom';

export interface CreateLegalDocumentParams {
  type: DocumentType;
  title: string;
  content: string;
  version: string;
  language?: string;
  effectiveDate?: string;
  requiresConsent?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateLegalDocumentParams {
  title?: string;
  content?: string;
  version?: string;
  effectiveDate?: string;
  expiryDate?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface GetLegalDocumentParams {
  type: DocumentType;
  version?: string;
  language?: string;
}

// =============================================================================
// DATA SUBJECT RIGHTS (GDPR)
// =============================================================================

export interface DataExportRequest {
  id: string;
  userId: string;
  requestType: DataRequestType;
  status: DataRequestStatus;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  exportUrl: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type DataRequestType = 'export' | 'deletion' | 'rectification' | 'restriction' | 'portability';

export type DataRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface RequestDataExportParams {
  userId: string;
  includeData?: string[];
  format?: 'json' | 'csv' | 'xml';
  metadata?: Record<string, any>;
}

export interface RequestDataDeletionParams {
  userId: string;
  deleteAll?: boolean;
  dataTypes?: string[];
  retentionOverride?: boolean;
  metadata?: Record<string, any>;
}

export interface DataExportResult {
  request: DataExportRequest;
  data?: any;
  downloadUrl?: string;
}

// =============================================================================
// DATA RETENTION TYPES
// =============================================================================

export interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string | null;
  dataType: string;
  retentionPeriodDays: number;
  autoDelete: boolean;
  archiveBeforeDelete: boolean;
  legalBasis: string | null;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRetentionPolicyParams {
  name: string;
  description?: string;
  dataType: string;
  retentionPeriodDays: number;
  autoDelete?: boolean;
  archiveBeforeDelete?: boolean;
  legalBasis?: string;
  metadata?: Record<string, any>;
}

export interface UpdateRetentionPolicyParams {
  name?: string;
  description?: string;
  retentionPeriodDays?: number;
  autoDelete?: boolean;
  archiveBeforeDelete?: boolean;
  legalBasis?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// =============================================================================
// AUDIT LOG TYPES
// =============================================================================

export interface ComplianceAuditLog {
  id: string;
  eventType: AuditEventType;
  userId: string | null;
  resourceType: string;
  resourceId: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  createdAt: string;
}

export type AuditEventType =
  | 'consent_granted'
  | 'consent_revoked'
  | 'data_exported'
  | 'data_deleted'
  | 'data_rectified'
  | 'policy_accepted'
  | 'policy_updated'
  | 'access_granted'
  | 'access_revoked';

export interface LogAuditEventParams {
  eventType: AuditEventType;
  userId?: string;
  resourceType: string;
  resourceId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface GetAuditLogParams {
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  eventType?: AuditEventType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResult {
  logs: ComplianceAuditLog[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// COOKIE CONSENT TYPES
// =============================================================================

export interface CookieConsent {
  id: string;
  userId: string | null;
  sessionId: string | null;
  preferences: CookiePreferences;
  consentDate: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  [key: string]: boolean;
}

export interface UpdateCookieConsentParams {
  userId?: string;
  sessionId?: string;
  preferences: Partial<CookiePreferences>;
  ipAddress?: string;
  userAgent?: string;
}

// =============================================================================
// PRIVACY SETTINGS TYPES
// =============================================================================

export interface PrivacySettings {
  id: string;
  userId: string;
  profileVisibility: VisibilityLevel;
  activityVisibility: VisibilityLevel;
  searchable: boolean;
  allowAnalytics: boolean;
  allowMarketing: boolean;
  allowThirdPartySharing: boolean;
  dataRetentionOptOut: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type VisibilityLevel = 'public' | 'friends' | 'private';

export interface UpdatePrivacySettingsParams {
  profileVisibility?: VisibilityLevel;
  activityVisibility?: VisibilityLevel;
  searchable?: boolean;
  allowAnalytics?: boolean;
  allowMarketing?: boolean;
  allowThirdPartySharing?: boolean;
  dataRetentionOptOut?: boolean;
  metadata?: Record<string, any>;
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

export interface CharterEngineConfig {
  enabled: boolean;
  gdprEnabled: boolean;
  consentExpiryDays: number;
  defaultRetentionDays: number;
  autoDeleteExpiredData: boolean;
  auditLogRetentionDays: number;
  requireExplicitConsent: boolean;
}

// =============================================================================
// ENGINE RESULT TYPES
// =============================================================================

export interface CharterEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: CharterEngineError;
}

export interface CharterEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// =============================================================================
// EVENT PAYLOAD TYPES
// =============================================================================

export interface ConsentGrantedEvent {
  consentId: string;
  userId: string;
  consentType: ConsentType;
  purpose: string;
  version: string;
  timestamp: string;
}

export interface ConsentRevokedEvent {
  consentId: string;
  userId: string;
  consentType: ConsentType;
  purpose: string;
  timestamp: string;
}

export interface DataExportedEvent {
  requestId: string;
  userId: string;
  format: string;
  dataTypes: string[];
  timestamp: string;
}

export interface DataDeletedEvent {
  requestId: string;
  userId: string;
  dataTypes: string[];
  permanent: boolean;
  timestamp: string;
}

export interface LegalDocumentCreatedEvent {
  documentId: string;
  type: DocumentType;
  version: string;
  requiresConsent: boolean;
  timestamp: string;
}

export interface LegalDocumentUpdatedEvent {
  documentId: string;
  type: DocumentType;
  version: string;
  changes: Partial<UpdateLegalDocumentParams>;
  timestamp: string;
}

export interface PolicyAcceptedEvent {
  userId: string;
  policyType: string;
  version: string;
  timestamp: string;
}

export interface PrivacySettingsUpdatedEvent {
  userId: string;
  changes: Partial<UpdatePrivacySettingsParams>;
  timestamp: string;
}
