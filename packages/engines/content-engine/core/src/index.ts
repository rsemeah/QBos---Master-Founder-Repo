/**
 * @qbos/content-engine-core - ContentEngine™ Core Package
 *
 * CMS and content versioning for QuietBuild OS.
 */

// Main engine class
export { ContentEngine } from './content.engine';
export type { ContentEngineConfig } from './content.engine';

// All types
export type {
  // Content types
  Content,
  ContentStatus,
  SEOMetadata,
  CreateContentParams,
  UpdateContentParams,
  GetContentParams,
  ListContentParams,
  ListContentResult,

  // Versioning types
  ContentVersion,
  CreateVersionParams,
  GetVersionParams,
  CompareVersionsParams,
  VersionDiff,
  RestoreVersionParams,

  // Content type types
  ContentType,
  ContentSchema,
  SchemaProperty,
  ContentField,
  FieldType,
  FieldValidation,
  CreateContentTypeParams,
  UpdateContentTypeParams,

  // Media types
  MediaAttachment,
  MediaType,
  AttachMediaParams,
  UpdateMediaParams,

  // Permission types
  ContentPermission,
  PermissionResourceType,
  Permission,
  GrantContentPermissionParams,
  RevokeContentPermissionParams,
  CheckContentPermissionParams,

  // Search types
  SearchContentParams,
  SearchContentResult,
  SearchIndexParams,

  // Workflow types
  PublishingWorkflow,
  WorkflowStage,
  WorkflowStageHistory,
  SubmitForReviewParams,
  ApproveContentParams,
  RejectContentParams,

  // Result types
  ContentEngineResult,
  ContentEngineError,

  // Event payload types
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentPublishedEvent,
  ContentDeletedEvent,
  ContentVersionCreatedEvent,
  ContentTypeCreatedEvent,
  ContentTypeUpdatedEvent,
  MediaAttachedEvent,
  MediaDetachedEvent,
} from './types';
