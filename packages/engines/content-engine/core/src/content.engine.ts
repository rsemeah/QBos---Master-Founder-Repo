/**
 * ContentEngine™
 *
 * CMS and content versioning for QuietBuild OS.
 *
 * Provides:
 * - Content creation, updating, and deletion
 * - Content versioning with full history
 * - Draft/published workflow with approvals
 * - Content types and custom schemas
 * - Rich metadata and SEO support
 * - Content search capabilities
 * - Media attachments
 * - Content permissions and access control
 *
 * Event-driven architecture:
 * - Emits: content.created, content.updated, content.published, content.deleted
 * - Listens: (none - foundational engine)
 */

import type { EventBus } from '@qbos/events';
import type {
  ContentEngineConfig,
  Content,
  CreateContentParams,
  UpdateContentParams,
  GetContentParams,
  ListContentParams,
  ListContentResult,
  ContentVersion,
  CreateVersionParams,
  GetVersionParams,
  RestoreVersionParams,
  ContentType,
  CreateContentTypeParams,
  UpdateContentTypeParams,
  MediaAttachment,
  AttachMediaParams,
  SearchContentParams,
  SearchContentResult,
  ContentEngineResult,
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentPublishedEvent,
  ContentDeletedEvent,
  ContentVersionCreatedEvent,
  ContentTypeCreatedEvent,
  ContentTypeUpdatedEvent,
  MediaAttachedEvent,
  MediaDetachedEvent,
  SEOMetadata,
} from './types';

export class ContentEngine {
  private config: ContentEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<ContentEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;

    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      enableVersioning: config.enableVersioning !== undefined ? config.enableVersioning : true,
      maxVersionsPerContent: config.maxVersionsPerContent || 100,
      enableSearch: config.enableSearch !== undefined ? config.enableSearch : true,
      enableWorkflow: config.enableWorkflow !== undefined ? config.enableWorkflow : true,
      defaultLocale: config.defaultLocale || 'en',
      supportedLocales: config.supportedLocales || ['en'],
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('ContentEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[ContentEngine] Engine is disabled');
      return;
    }

    console.log('[ContentEngine] Initializing...');

    // Initialize search index if enabled
    if (this.config.enableSearch) {
      await this.initializeSearchIndex();
    }

    this.initialized = true;
    console.log('[ContentEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[ContentEngine] Shutting down...');

    this.initialized = false;
    console.log('[ContentEngine] Shutdown complete');
  }

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    if (!this.config.enabled) {
      return { ok: false, message: 'Engine is disabled' };
    }

    if (!this.initialized) {
      return { ok: false, message: 'Engine not initialized' };
    }

    return { ok: true };
  }

  getConfig(): Readonly<ContentEngineConfig> {
    return { ...this.config };
  }

  // =============================================================================
  // CONTENT MANAGEMENT
  // =============================================================================

  async createContent(params: CreateContentParams): Promise<ContentEngineResult<Content>> {
    try {
      // Validate content type exists
      const contentType = await this.fetchContentTypeById(params.contentTypeId);
      if (!contentType) {
        return {
          ok: false,
          error: {
            code: 'CONTENT_TYPE_NOT_FOUND',
            message: 'Content type not found',
            details: { contentTypeId: params.contentTypeId },
          },
        };
      }

      // Check if slug is unique
      const existing = await this.fetchContentBySlug(params.slug);
      if (existing) {
        return {
          ok: false,
          error: {
            code: 'SLUG_ALREADY_EXISTS',
            message: 'Content with this slug already exists',
            details: { slug: params.slug },
          },
        };
      }

      const now = new Date().toISOString();
      const defaultSEO: SEOMetadata = {
        metaTitle: null,
        metaDescription: null,
        metaKeywords: [],
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        twitterCard: null,
        canonicalUrl: null,
      };

      const content: Content = {
        id: this.generateId('content'),
        contentTypeId: params.contentTypeId,
        slug: params.slug,
        title: params.title,
        body: params.body,
        excerpt: params.excerpt || null,
        status: params.status || 'draft',
        authorId: params.authorId,
        publishedAt: params.status === 'published' ? now : null,
        scheduledFor: params.scheduledFor || null,
        expiresAt: null,
        locale: params.locale || this.config.defaultLocale,
        metadata: params.metadata || {},
        seoMetadata: { ...defaultSEO, ...params.seoMetadata },
        tags: params.tags || [],
        categories: params.categories || [],
        featuredImageId: params.featuredImageId || null,
        version: 1,
        parentId: null,
        templateId: params.templateId || null,
        createdAt: now,
        updatedAt: now,
      };

      await this.storeContent(content);
      this.emitContentCreated(content);

      // Create initial version if versioning enabled
      if (this.config.enableVersioning && contentType.allowVersioning) {
        await this.createVersion({
          contentId: content.id,
          authorId: params.authorId,
          changeDescription: 'Initial version',
        });
      }

      // Index for search
      if (this.config.enableSearch) {
        await this.indexContent(content.id);
      }

      return { ok: true, data: content };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_CONTENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  async getContent(params: GetContentParams): Promise<ContentEngineResult<Content>> {
    try {
      let content: Content | null = null;

      if (params.contentId) {
        content = await this.fetchContentById(params.contentId);
      } else if (params.slug) {
        content = await this.fetchContentBySlug(params.slug);
      }

      if (!content) {
        return {
          ok: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content not found',
            details: params,
          },
        };
      }

      // Filter unpublished content unless explicitly requested
      if (!params.includeUnpublished && content.status !== 'published') {
        return {
          ok: false,
          error: {
            code: 'CONTENT_NOT_PUBLISHED',
            message: 'Content is not published',
            details: { contentId: content.id, status: content.status },
          },
        };
      }

      return { ok: true, data: content };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_CONTENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  async updateContent(contentId: string, params: UpdateContentParams): Promise<ContentEngineResult<Content>> {
    try {
      const content = await this.fetchContentById(contentId);

      if (!content) {
        return {
          ok: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content not found',
            details: { contentId },
          },
        };
      }

      const now = new Date().toISOString();
      const wasPublished = content.status === 'published';
      const willBePublished = params.status === 'published';

      const updatedContent: Content = {
        ...content,
        slug: params.slug !== undefined ? params.slug : content.slug,
        title: params.title !== undefined ? params.title : content.title,
        body: params.body !== undefined ? params.body : content.body,
        excerpt: params.excerpt !== undefined ? params.excerpt : content.excerpt,
        status: params.status !== undefined ? params.status : content.status,
        scheduledFor: params.scheduledFor !== undefined ? params.scheduledFor : content.scheduledFor,
        publishedAt: !wasPublished && willBePublished ? now : content.publishedAt,
        metadata: params.metadata !== undefined ? { ...content.metadata, ...params.metadata } : content.metadata,
        seoMetadata:
          params.seoMetadata !== undefined
            ? { ...content.seoMetadata, ...params.seoMetadata }
            : content.seoMetadata,
        tags: params.tags !== undefined ? params.tags : content.tags,
        categories: params.categories !== undefined ? params.categories : content.categories,
        featuredImageId:
          params.featuredImageId !== undefined ? params.featuredImageId : content.featuredImageId,
        version: content.version + 1,
        updatedAt: now,
      };

      await this.storeContent(updatedContent);
      this.emitContentUpdated(updatedContent, params);

      // Publish event if status changed to published
      if (!wasPublished && willBePublished) {
        this.emitContentPublished(updatedContent);
      }

      // Update search index
      if (this.config.enableSearch) {
        await this.indexContent(updatedContent.id);
      }

      return { ok: true, data: updatedContent };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_CONTENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  async deleteContent(contentId: string, permanent: boolean = false): Promise<ContentEngineResult<void>> {
    try {
      const content = await this.fetchContentById(contentId);

      if (!content) {
        return {
          ok: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content not found',
            details: { contentId },
          },
        };
      }

      if (permanent) {
        await this.deleteContentRecord(contentId);
      } else {
        // Soft delete: archive
        const archivedContent: Content = {
          ...content,
          status: 'archived',
          updatedAt: new Date().toISOString(),
        };
        await this.storeContent(archivedContent);
      }

      this.emitContentDeleted(content, permanent);

      // Remove from search index
      if (this.config.enableSearch) {
        await this.removeFromIndex(contentId);
      }

      return { ok: true };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'DELETE_CONTENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  async listContent(params: ListContentParams): Promise<ContentEngineResult<ListContentResult>> {
    try {
      const limit = params.limit || 50;
      const offset = params.offset || 0;

      const contents = await this.fetchContents(params);
      const total = await this.countContents(params);

      const result: ListContentResult = {
        contents,
        total,
        limit,
        offset,
      };

      return { ok: true, data: result };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'LIST_CONTENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  async publishContent(contentId: string): Promise<ContentEngineResult<Content>> {
    return this.updateContent(contentId, { status: 'published' });
  }

  async unpublishContent(contentId: string): Promise<ContentEngineResult<Content>> {
    return this.updateContent(contentId, { status: 'draft' });
  }

  // =============================================================================
  // CONTENT VERSIONING
  // =============================================================================

  async createVersion(params: CreateVersionParams): Promise<ContentEngineResult<ContentVersion>> {
    try {
      if (!this.config.enableVersioning) {
        return {
          ok: false,
          error: {
            code: 'VERSIONING_DISABLED',
            message: 'Content versioning is disabled',
          },
        };
      }

      const content = await this.fetchContentById(params.contentId);

      if (!content) {
        return {
          ok: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content not found',
            details: { contentId: params.contentId },
          },
        };
      }

      const now = new Date().toISOString();
      const version: ContentVersion = {
        id: this.generateId('version'),
        contentId: params.contentId,
        version: content.version,
        title: content.title,
        body: content.body,
        excerpt: content.excerpt,
        metadata: content.metadata,
        authorId: params.authorId,
        changeDescription: params.changeDescription || null,
        createdAt: now,
      };

      await this.storeContentVersion(version);
      this.emitContentVersionCreated(version);

      // Cleanup old versions if exceeding limit
      await this.cleanupOldVersions(params.contentId);

      return { ok: true, data: version };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_VERSION_FAILED',
          message: error.message,
        },
      };
    }
  }

  async getVersion(params: GetVersionParams): Promise<ContentEngineResult<ContentVersion>> {
    try {
      const version = await this.fetchContentVersion(params.contentId, params.version);

      if (!version) {
        return {
          ok: false,
          error: {
            code: 'VERSION_NOT_FOUND',
            message: 'Content version not found',
            details: params,
          },
        };
      }

      return { ok: true, data: version };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_VERSION_FAILED',
          message: error.message,
        },
      };
    }
  }

  async listVersions(contentId: string): Promise<ContentEngineResult<ContentVersion[]>> {
    try {
      const versions = await this.fetchContentVersions(contentId);
      return { ok: true, data: versions };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'LIST_VERSIONS_FAILED',
          message: error.message,
        },
      };
    }
  }

  async restoreVersion(params: RestoreVersionParams): Promise<ContentEngineResult<Content>> {
    try {
      const version = await this.fetchContentVersion(params.contentId, params.version);

      if (!version) {
        return {
          ok: false,
          error: {
            code: 'VERSION_NOT_FOUND',
            message: 'Content version not found',
            details: params,
          },
        };
      }

      // Restore content from version
      return this.updateContent(params.contentId, {
        title: version.title,
        body: version.body,
        excerpt: version.excerpt !== null ? version.excerpt : undefined,
        metadata: version.metadata,
      });
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'RESTORE_VERSION_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // CONTENT TYPE MANAGEMENT
  // =============================================================================

  async createContentType(params: CreateContentTypeParams): Promise<ContentEngineResult<ContentType>> {
    try {
      const now = new Date().toISOString();

      const contentType: ContentType = {
        id: this.generateId('type'),
        key: params.key,
        name: params.name,
        description: params.description || null,
        schema: params.schema,
        fields: params.fields.map((field, index) => ({
          ...field,
          id: this.generateId('field'),
          order: index,
        })),
        isActive: true,
        allowVersioning: params.allowVersioning !== undefined ? params.allowVersioning : true,
        requiresReview: params.requiresReview !== undefined ? params.requiresReview : false,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeContentType(contentType);
      this.emitContentTypeCreated(contentType);

      return { ok: true, data: contentType };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_CONTENT_TYPE_FAILED',
          message: error.message,
        },
      };
    }
  }

  async updateContentType(
    contentTypeId: string,
    params: UpdateContentTypeParams
  ): Promise<ContentEngineResult<ContentType>> {
    try {
      const contentType = await this.fetchContentTypeById(contentTypeId);

      if (!contentType) {
        return {
          ok: false,
          error: {
            code: 'CONTENT_TYPE_NOT_FOUND',
            message: 'Content type not found',
            details: { contentTypeId },
          },
        };
      }

      const updatedContentType: ContentType = {
        ...contentType,
        name: params.name !== undefined ? params.name : contentType.name,
        description: params.description !== undefined ? params.description : contentType.description,
        schema: params.schema !== undefined ? params.schema : contentType.schema,
        fields: params.fields !== undefined ? params.fields : contentType.fields,
        isActive: params.isActive !== undefined ? params.isActive : contentType.isActive,
        allowVersioning:
          params.allowVersioning !== undefined ? params.allowVersioning : contentType.allowVersioning,
        requiresReview:
          params.requiresReview !== undefined ? params.requiresReview : contentType.requiresReview,
        metadata:
          params.metadata !== undefined
            ? { ...contentType.metadata, ...params.metadata }
            : contentType.metadata,
        updatedAt: new Date().toISOString(),
      };

      await this.storeContentType(updatedContentType);
      this.emitContentTypeUpdated(contentType.id, contentType.key, params);

      return { ok: true, data: updatedContentType };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_CONTENT_TYPE_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // MEDIA ATTACHMENTS
  // =============================================================================

  async attachMedia(params: AttachMediaParams): Promise<ContentEngineResult<MediaAttachment>> {
    try {
      const now = new Date().toISOString();

      const attachment: MediaAttachment = {
        id: this.generateId('media'),
        contentId: params.contentId,
        fileId: params.fileId,
        type: params.type,
        url: await this.getFileUrl(params.fileId),
        title: params.title !== undefined ? params.title : null,
        caption: params.caption !== undefined ? params.caption : null,
        altText: params.altText !== undefined ? params.altText : null,
        order: params.order || 0,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeMediaAttachment(attachment);
      this.emitMediaAttached(attachment);

      return { ok: true, data: attachment };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'ATTACH_MEDIA_FAILED',
          message: error.message,
        },
      };
    }
  }

  async detachMedia(attachmentId: string): Promise<ContentEngineResult<void>> {
    try {
      const attachment = await this.fetchMediaAttachment(attachmentId);

      if (!attachment) {
        return {
          ok: false,
          error: {
            code: 'MEDIA_ATTACHMENT_NOT_FOUND',
            message: 'Media attachment not found',
            details: { attachmentId },
          },
        };
      }

      await this.deleteMediaAttachment(attachmentId);
      this.emitMediaDetached(attachment);

      return { ok: true };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'DETACH_MEDIA_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // CONTENT SEARCH
  // =============================================================================

  async searchContent(params: SearchContentParams): Promise<ContentEngineResult<SearchContentResult>> {
    try {
      if (!this.config.enableSearch) {
        return {
          ok: false,
          error: {
            code: 'SEARCH_DISABLED',
            message: 'Content search is disabled',
          },
        };
      }

      const startTime = Date.now();
      const limit = params.limit || 50;
      const offset = params.offset || 0;

      const contents = await this.performSearch(params);
      const total = contents.length;

      const result: SearchContentResult = {
        contents,
        total,
        limit,
        offset,
        took: Date.now() - startTime,
      };

      return { ok: true, data: result };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'SEARCH_CONTENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private async getFileUrl(fileId: string): Promise<string> {
    console.log('[ContentEngine] Get file URL:', fileId);
    // This is a stub that would fetch file URL from VaultEngine
    return `https://cdn.example.com/files/${fileId}`;
  }

  private async initializeSearchIndex(): Promise<void> {
    console.log('[ContentEngine] Initializing search index');
    // This would initialize search index (Elasticsearch, etc.)
  }

  private async indexContent(contentId: string): Promise<void> {
    console.log('[ContentEngine] Index content:', contentId);
    // This would index content for search
  }

  private async removeFromIndex(contentId: string): Promise<void> {
    console.log('[ContentEngine] Remove from index:', contentId);
    // This would remove content from search index
  }

  private async performSearch(params: SearchContentParams): Promise<Content[]> {
    console.log('[ContentEngine] Perform search:', params.query);
    // This is a stub that would perform actual search
    return [];
  }

  private async cleanupOldVersions(contentId: string): Promise<void> {
    console.log('[ContentEngine] Cleanup old versions:', contentId);
    // This would delete old versions exceeding maxVersionsPerContent
  }

  // Database stubs
  private async storeContent(content: Content): Promise<void> {
    console.log('[ContentEngine] Store content:', content.id);
  }

  private async fetchContentById(contentId: string): Promise<Content | null> {
    console.log('[ContentEngine] Fetch content by ID:', contentId);
    return null;
  }

  private async fetchContentBySlug(slug: string): Promise<Content | null> {
    console.log('[ContentEngine] Fetch content by slug:', slug);
    return null;
  }

  private async fetchContents(params: ListContentParams): Promise<Content[]> {
    console.log('[ContentEngine] Fetch contents:', params);
    return [];
  }

  private async countContents(params: ListContentParams): Promise<number> {
    console.log('[ContentEngine] Count contents:', params);
    return 0;
  }

  private async deleteContentRecord(contentId: string): Promise<void> {
    console.log('[ContentEngine] Delete content record:', contentId);
  }

  private async storeContentVersion(version: ContentVersion): Promise<void> {
    console.log('[ContentEngine] Store content version:', version.id);
  }

  private async fetchContentVersion(contentId: string, version?: number): Promise<ContentVersion | null> {
    console.log('[ContentEngine] Fetch content version:', contentId, version);
    return null;
  }

  private async fetchContentVersions(contentId: string): Promise<ContentVersion[]> {
    console.log('[ContentEngine] Fetch content versions:', contentId);
    return [];
  }

  private async storeContentType(contentType: ContentType): Promise<void> {
    console.log('[ContentEngine] Store content type:', contentType.id);
  }

  private async fetchContentTypeById(contentTypeId: string): Promise<ContentType | null> {
    console.log('[ContentEngine] Fetch content type by ID:', contentTypeId);
    return null;
  }

  private async storeMediaAttachment(attachment: MediaAttachment): Promise<void> {
    console.log('[ContentEngine] Store media attachment:', attachment.id);
  }

  private async fetchMediaAttachment(attachmentId: string): Promise<MediaAttachment | null> {
    console.log('[ContentEngine] Fetch media attachment:', attachmentId);
    return null;
  }

  private async deleteMediaAttachment(attachmentId: string): Promise<void> {
    console.log('[ContentEngine] Delete media attachment:', attachmentId);
  }

  // Event emitters
  private emitContentCreated(content: Content): void {
    const payload: ContentCreatedEvent = {
      contentId: content.id,
      contentTypeId: content.contentTypeId,
      slug: content.slug,
      title: content.title,
      authorId: content.authorId,
      status: content.status,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.created', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit content.created event:', error);
      });
    });
  }

  private emitContentUpdated(content: Content, changes: UpdateContentParams): void {
    const payload: ContentUpdatedEvent = {
      contentId: content.id,
      slug: content.slug,
      title: content.title,
      changes,
      authorId: content.authorId,
      version: content.version,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.updated', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit content.updated event:', error);
      });
    });
  }

  private emitContentPublished(content: Content): void {
    const payload: ContentPublishedEvent = {
      contentId: content.id,
      slug: content.slug,
      title: content.title,
      authorId: content.authorId,
      publishedAt: content.publishedAt!,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.published', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit content.published event:', error);
      });
    });
  }

  private emitContentDeleted(content: Content, permanent: boolean): void {
    const payload: ContentDeletedEvent = {
      contentId: content.id,
      slug: content.slug,
      title: content.title,
      deletedBy: content.authorId,
      permanent,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.deleted', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit content.deleted event:', error);
      });
    });
  }

  private emitContentVersionCreated(version: ContentVersion): void {
    const payload: ContentVersionCreatedEvent = {
      versionId: version.id,
      contentId: version.contentId,
      version: version.version,
      authorId: version.authorId,
      changeDescription: version.changeDescription,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.version.created', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit version.created event:', error);
      });
    });
  }

  private emitContentTypeCreated(contentType: ContentType): void {
    const payload: ContentTypeCreatedEvent = {
      contentTypeId: contentType.id,
      key: contentType.key,
      name: contentType.name,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.type.created', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit type.created event:', error);
      });
    });
  }

  private emitContentTypeUpdated(contentTypeId: string, key: string, changes: UpdateContentTypeParams): void {
    const payload: ContentTypeUpdatedEvent = {
      contentTypeId,
      key,
      changes,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.type.updated', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit type.updated event:', error);
      });
    });
  }

  private emitMediaAttached(attachment: MediaAttachment): void {
    const payload: MediaAttachedEvent = {
      attachmentId: attachment.id,
      contentId: attachment.contentId,
      fileId: attachment.fileId,
      type: attachment.type,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.media.attached', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit media.attached event:', error);
      });
    });
  }

  private emitMediaDetached(attachment: MediaAttachment): void {
    const payload: MediaDetachedEvent = {
      attachmentId: attachment.id,
      contentId: attachment.contentId,
      fileId: attachment.fileId,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('content.media.detached', payload).catch((error: any) => {
        console.error('[ContentEngine] Failed to emit media.detached event:', error);
      });
    });
  }
}

export type { ContentEngineConfig };
