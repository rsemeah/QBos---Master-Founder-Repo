/**
 * ContentEngine Types
 *
 * Complete type definitions for the ContentEngine.
 * CMS and content versioning.
 */

// =============================================================================
// CONTENT TYPES
// =============================================================================

export interface Content {
  id: string;
  contentTypeId: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  status: ContentStatus;
  authorId: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  expiresAt: string | null;
  locale: string;
  metadata: Record<string, any>;
  seoMetadata: SEOMetadata;
  tags: string[];
  categories: string[];
  featuredImageId: string | null;
  version: number;
  parentId: string | null;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContentStatus = 'draft' | 'published' | 'archived' | 'scheduled' | 'review';

export interface SEOMetadata {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  canonicalUrl: string | null;
}

export interface CreateContentParams {
  contentTypeId: string;
  slug: string;
  title: string;
  body: string;
  excerpt?: string;
  status?: ContentStatus;
  authorId: string;
  scheduledFor?: string;
  locale?: string;
  metadata?: Record<string, any>;
  seoMetadata?: Partial<SEOMetadata>;
  tags?: string[];
  categories?: string[];
  featuredImageId?: string;
  templateId?: string;
}

export interface UpdateContentParams {
  slug?: string;
  title?: string;
  body?: string;
  excerpt?: string;
  status?: ContentStatus;
  scheduledFor?: string;
  metadata?: Record<string, any>;
  seoMetadata?: Partial<SEOMetadata>;
  tags?: string[];
  categories?: string[];
  featuredImageId?: string;
}

export interface GetContentParams {
  contentId?: string;
  slug?: string;
  includeUnpublished?: boolean;
}

export interface ListContentParams {
  contentTypeId?: string;
  status?: ContentStatus;
  authorId?: string;
  tags?: string[];
  categories?: string[];
  search?: string;
  locale?: string;
  limit?: number;
  offset?: number;
}

export interface ListContentResult {
  contents: Content[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// CONTENT VERSIONING TYPES
// =============================================================================

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  title: string;
  body: string;
  excerpt: string | null;
  metadata: Record<string, any>;
  authorId: string;
  changeDescription: string | null;
  createdAt: string;
}

export interface CreateVersionParams {
  contentId: string;
  authorId: string;
  changeDescription?: string;
}

export interface GetVersionParams {
  contentId: string;
  version?: number;
}

export interface CompareVersionsParams {
  contentId: string;
  versionA: number;
  versionB: number;
}

export interface VersionDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

export interface RestoreVersionParams {
  contentId: string;
  version: number;
  authorId: string;
}

// =============================================================================
// CONTENT TYPE TYPES
// =============================================================================

export interface ContentType {
  id: string;
  key: string;
  name: string;
  description: string | null;
  schema: ContentSchema;
  fields: ContentField[];
  isActive: boolean;
  allowVersioning: boolean;
  requiresReview: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ContentSchema {
  version: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'rich_text' | 'markdown' | 'date' | 'file';
  description?: string;
  default?: any;
  enum?: any[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
}

export interface ContentField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  defaultValue: any;
  validation: FieldValidation;
  options: Record<string, any>;
  order: number;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'rich_text'
  | 'markdown'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'file'
  | 'image'
  | 'relation'
  | 'json';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

export interface CreateContentTypeParams {
  key: string;
  name: string;
  description?: string;
  schema: ContentSchema;
  fields: Omit<ContentField, 'id'>[];
  allowVersioning?: boolean;
  requiresReview?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateContentTypeParams {
  name?: string;
  description?: string;
  schema?: ContentSchema;
  fields?: ContentField[];
  isActive?: boolean;
  allowVersioning?: boolean;
  requiresReview?: boolean;
  metadata?: Record<string, any>;
}

// =============================================================================
// MEDIA ATTACHMENT TYPES
// =============================================================================

export interface MediaAttachment {
  id: string;
  contentId: string;
  fileId: string;
  type: MediaType;
  url: string;
  title: string | null;
  caption: string | null;
  altText: string | null;
  order: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface AttachMediaParams {
  contentId: string;
  fileId: string;
  type: MediaType;
  title?: string;
  caption?: string;
  altText?: string;
  order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateMediaParams {
  title?: string;
  caption?: string;
  altText?: string;
  order?: number;
  metadata?: Record<string, any>;
}

// =============================================================================
// CONTENT PERMISSIONS TYPES
// =============================================================================

export interface ContentPermission {
  id: string;
  contentId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  permissions: Permission[];
  createdAt: string;
}

export type PermissionResourceType = 'user' | 'team' | 'role';

export type Permission = 'view' | 'edit' | 'delete' | 'publish';

export interface GrantContentPermissionParams {
  contentId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  permissions: Permission[];
}

export interface RevokeContentPermissionParams {
  contentId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
}

export interface CheckContentPermissionParams {
  contentId: string;
  userId: string;
  permission: Permission;
}

// =============================================================================
// CONTENT SEARCH TYPES
// =============================================================================

export interface SearchContentParams {
  query: string;
  contentTypeId?: string;
  status?: ContentStatus;
  tags?: string[];
  categories?: string[];
  authorId?: string;
  locale?: string;
  limit?: number;
  offset?: number;
}

export interface SearchContentResult {
  contents: Content[];
  total: number;
  limit: number;
  offset: number;
  took: number;
}

export interface SearchIndexParams {
  contentId: string;
}

// =============================================================================
// PUBLISHING WORKFLOW TYPES
// =============================================================================

export interface PublishingWorkflow {
  id: string;
  contentId: string;
  currentStage: WorkflowStage;
  stages: WorkflowStageHistory[];
  requiresApproval: boolean;
  approvers: string[];
  createdAt: string;
  updatedAt: string;
}

export type WorkflowStage = 'draft' | 'review' | 'approved' | 'published' | 'rejected';

export interface WorkflowStageHistory {
  stage: WorkflowStage;
  userId: string;
  comment: string | null;
  timestamp: string;
}

export interface SubmitForReviewParams {
  contentId: string;
  reviewers: string[];
  comment?: string;
}

export interface ApproveContentParams {
  contentId: string;
  approverId: string;
  comment?: string;
  publish?: boolean;
}

export interface RejectContentParams {
  contentId: string;
  reviewerId: string;
  comment: string;
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

export interface ContentEngineConfig {
  enabled: boolean;
  enableVersioning: boolean;
  maxVersionsPerContent: number;
  enableSearch: boolean;
  enableWorkflow: boolean;
  defaultLocale: string;
  supportedLocales: string[];
}

// =============================================================================
// ENGINE RESULT TYPES
// =============================================================================

export interface ContentEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: ContentEngineError;
}

export interface ContentEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// =============================================================================
// EVENT PAYLOAD TYPES
// =============================================================================

export interface ContentCreatedEvent {
  contentId: string;
  contentTypeId: string;
  slug: string;
  title: string;
  authorId: string;
  status: ContentStatus;
  timestamp: string;
}

export interface ContentUpdatedEvent {
  contentId: string;
  slug: string;
  title: string;
  changes: Partial<UpdateContentParams>;
  authorId: string;
  version: number;
  timestamp: string;
}

export interface ContentPublishedEvent {
  contentId: string;
  slug: string;
  title: string;
  authorId: string;
  publishedAt: string;
  timestamp: string;
}

export interface ContentDeletedEvent {
  contentId: string;
  slug: string;
  title: string;
  deletedBy: string;
  permanent: boolean;
  timestamp: string;
}

export interface ContentVersionCreatedEvent {
  versionId: string;
  contentId: string;
  version: number;
  authorId: string;
  changeDescription: string | null;
  timestamp: string;
}

export interface ContentTypeCreatedEvent {
  contentTypeId: string;
  key: string;
  name: string;
  timestamp: string;
}

export interface ContentTypeUpdatedEvent {
  contentTypeId: string;
  key: string;
  changes: Partial<UpdateContentTypeParams>;
  timestamp: string;
}

export interface MediaAttachedEvent {
  attachmentId: string;
  contentId: string;
  fileId: string;
  type: MediaType;
  timestamp: string;
}

export interface MediaDetachedEvent {
  attachmentId: string;
  contentId: string;
  fileId: string;
  timestamp: string;
}
