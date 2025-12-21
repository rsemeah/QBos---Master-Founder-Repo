/**
 * NotificationsEngine™
 *
 * Multi-channel notification delivery for QuietBuild OS.
 *
 * Provides:
 * - Email notifications with template support
 * - SMS notifications via multiple providers
 * - Push notifications (FCM, APNS)
 * - Webhook notifications for integrations
 * - Template management and rendering
 * - Delivery tracking and retry logic
 * - Provider abstraction layer
 *
 * Event-driven architecture:
 * - Emits: notifications.email.sent, notifications.sms.sent, notifications.push.sent, notifications.webhook.sent
 * - Listens: (none - foundational engine)
 */

import type { EventBus } from '@qbos/events';
import type {
  NotificationsEngineConfig,
  Notification,
  SendNotificationParams,
  SendEmailParams,
  SendSMSParams,
  SendPushParams,
  SendWebhookParams,
  NotificationTemplate,
  CreateTemplateParams,
  UpdateTemplateParams,
  RenderTemplateParams,
  RenderTemplateResult,
  NotificationProvider,
  CreateProviderParams,
  UpdateProviderParams,
  DeliveryEvent,
  RecordDeliveryEventParams,
  GetNotificationHistoryParams,
  SendBatchParams,
  BatchResult,
  NotificationsEngineResult,
  EmailSentEvent,
  SMSSentEvent,
  PushSentEvent,
  WebhookSentEvent,
  NotificationDeliveredEvent,
  NotificationFailedEvent,
  TemplateCreatedEvent,
  TemplateUpdatedEvent,
  ProviderCreatedEvent,
  ProviderUpdatedEvent,
  NotificationChannel,
} from './types';

export class NotificationsEngine {
  private config: NotificationsEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;
  private providers: Map<string, NotificationProvider> = new Map();

  constructor(config: Partial<NotificationsEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;

    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      defaultRetryCount: config.defaultRetryCount || 3,
      retryDelaySeconds: config.retryDelaySeconds || 60,
      maxBatchSize: config.maxBatchSize || 1000,
      enableDeliveryTracking: config.enableDeliveryTracking !== undefined ? config.enableDeliveryTracking : true,
      defaultProvider: config.defaultProvider || {},
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('NotificationsEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[NotificationsEngine] Engine is disabled');
      return;
    }

    console.log('[NotificationsEngine] Initializing...');

    // Load providers from database
    await this.loadProviders();

    this.initialized = true;
    console.log('[NotificationsEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[NotificationsEngine] Shutting down...');

    // Clear provider cache
    this.providers.clear();

    this.initialized = false;
    console.log('[NotificationsEngine] Shutdown complete');
  }

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    if (!this.config.enabled) {
      return { ok: false, message: 'Engine is disabled' };
    }

    if (!this.initialized) {
      return { ok: false, message: 'Engine not initialized' };
    }

    // Check if at least one provider is configured
    if (this.providers.size === 0) {
      return { ok: false, message: 'No notification providers configured' };
    }

    return { ok: true };
  }

  getConfig(): Readonly<NotificationsEngineConfig> {
    return { ...this.config };
  }

  // =============================================================================
  // NOTIFICATION SENDING
  // =============================================================================

  async sendNotification(params: SendNotificationParams): Promise<NotificationsEngineResult<Notification>> {
    try {
      // Route to specific channel handler
      switch (params.channel) {
        case 'email':
          return await this.sendEmailFromParams(params);
        case 'sms':
          return await this.sendSMSFromParams(params);
        case 'push':
          return await this.sendPushFromParams(params);
        case 'webhook':
          return await this.sendWebhookFromParams(params);
        default:
          return {
            ok: false,
            error: {
              code: 'INVALID_CHANNEL',
              message: 'Invalid notification channel',
              details: { channel: params.channel },
            },
          };
      }
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'SEND_NOTIFICATION_FAILED',
          message: error.message,
        },
      };
    }
  }

  async sendEmail(params: SendEmailParams): Promise<NotificationsEngineResult<Notification>> {
    try {
      const now = new Date().toISOString();
      const notification: Notification = {
        id: this.generateId('notification'),
        channel: 'email',
        recipientId: null,
        recipientAddress: params.to,
        subject: params.subject,
        body: params.body,
        templateId: params.templateId || null,
        templateData: params.templateData || {},
        status: 'pending',
        priority: 'normal',
        providerId: null,
        providerMessageId: null,
        scheduledFor: null,
        sentAt: null,
        deliveredAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: this.config.defaultRetryCount,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      // Store notification
      await this.storeNotification(notification);

      // Get provider
      const provider = await this.getProviderForChannel('email');
      if (provider) {
        notification.providerId = provider.id;
      }

      // Simulate sending
      const sent = await this.sendViaProvider(notification, params);

      if (sent) {
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitEmailSent(notification, params.subject);

        if (this.config.enableDeliveryTracking) {
          await this.recordDeliveryEvent({
            notificationId: notification.id,
            eventType: 'sent',
          });
        }
      } else {
        notification.status = 'failed';
        notification.failedAt = new Date().toISOString();
        notification.errorMessage = 'Failed to send via provider';
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitNotificationFailed(notification);
      }

      return { ok: true, data: notification };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'SEND_EMAIL_FAILED',
          message: error.message,
        },
      };
    }
  }

  async sendSMS(params: SendSMSParams): Promise<NotificationsEngineResult<Notification>> {
    try {
      const now = new Date().toISOString();
      const notification: Notification = {
        id: this.generateId('notification'),
        channel: 'sms',
        recipientId: null,
        recipientAddress: params.to,
        subject: null,
        body: params.body,
        templateId: params.templateId || null,
        templateData: params.templateData || {},
        status: 'pending',
        priority: 'normal',
        providerId: null,
        providerMessageId: null,
        scheduledFor: null,
        sentAt: null,
        deliveredAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: this.config.defaultRetryCount,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeNotification(notification);

      const provider = await this.getProviderForChannel('sms');
      if (provider) {
        notification.providerId = provider.id;
      }

      const sent = await this.sendViaProvider(notification, params);

      if (sent) {
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitSMSSent(notification);

        if (this.config.enableDeliveryTracking) {
          await this.recordDeliveryEvent({
            notificationId: notification.id,
            eventType: 'sent',
          });
        }
      } else {
        notification.status = 'failed';
        notification.failedAt = new Date().toISOString();
        notification.errorMessage = 'Failed to send via provider';
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitNotificationFailed(notification);
      }

      return { ok: true, data: notification };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'SEND_SMS_FAILED',
          message: error.message,
        },
      };
    }
  }

  async sendPush(params: SendPushParams): Promise<NotificationsEngineResult<Notification>> {
    try {
      const now = new Date().toISOString();
      const notification: Notification = {
        id: this.generateId('notification'),
        channel: 'push',
        recipientId: null,
        recipientAddress: params.to,
        subject: params.title,
        body: params.body,
        templateId: params.templateId || null,
        templateData: params.templateData || {},
        status: 'pending',
        priority: 'normal',
        providerId: null,
        providerMessageId: null,
        scheduledFor: null,
        sentAt: null,
        deliveredAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: this.config.defaultRetryCount,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeNotification(notification);

      const provider = await this.getProviderForChannel('push');
      if (provider) {
        notification.providerId = provider.id;
      }

      const sent = await this.sendViaProvider(notification, params);

      if (sent) {
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitPushSent(notification, params.title);

        if (this.config.enableDeliveryTracking) {
          await this.recordDeliveryEvent({
            notificationId: notification.id,
            eventType: 'sent',
          });
        }
      } else {
        notification.status = 'failed';
        notification.failedAt = new Date().toISOString();
        notification.errorMessage = 'Failed to send via provider';
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitNotificationFailed(notification);
      }

      return { ok: true, data: notification };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'SEND_PUSH_FAILED',
          message: error.message,
        },
      };
    }
  }

  async sendWebhook(params: SendWebhookParams): Promise<NotificationsEngineResult<Notification>> {
    try {
      const now = new Date().toISOString();
      const notification: Notification = {
        id: this.generateId('notification'),
        channel: 'webhook',
        recipientId: null,
        recipientAddress: params.url,
        subject: null,
        body: JSON.stringify(params.body || {}),
        templateId: null,
        templateData: {},
        status: 'pending',
        priority: 'normal',
        providerId: null,
        providerMessageId: null,
        scheduledFor: null,
        sentAt: null,
        deliveredAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: params.retryCount || this.config.defaultRetryCount,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeNotification(notification);

      const sent = await this.sendViaProvider(notification, params);

      if (sent) {
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitWebhookSent(notification, params.url, params.method || 'POST', 200);

        if (this.config.enableDeliveryTracking) {
          await this.recordDeliveryEvent({
            notificationId: notification.id,
            eventType: 'sent',
          });
        }
      } else {
        notification.status = 'failed';
        notification.failedAt = new Date().toISOString();
        notification.errorMessage = 'Failed to send webhook';
        notification.updatedAt = new Date().toISOString();
        await this.storeNotification(notification);

        this.emitNotificationFailed(notification);
      }

      return { ok: true, data: notification };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'SEND_WEBHOOK_FAILED',
          message: error.message,
        },
      };
    }
  }

  async sendBatch(params: SendBatchParams): Promise<NotificationsEngineResult<BatchResult>> {
    try {
      if (params.recipients.length > this.config.maxBatchSize) {
        return {
          ok: false,
          error: {
            code: 'BATCH_TOO_LARGE',
            message: `Batch size exceeds maximum of ${this.config.maxBatchSize}`,
            details: { size: params.recipients.length, max: this.config.maxBatchSize },
          },
        };
      }

      const notifications: Notification[] = [];
      let successful = 0;
      let failed = 0;

      for (const recipient of params.recipients) {
        const notificationParams: SendNotificationParams = {
          channel: params.channel,
          recipientId: recipient.recipientId,
          recipientAddress: recipient.recipientAddress,
          subject: params.subject,
          body: params.body,
          templateId: params.templateId,
          templateData: { ...params.templateData, ...recipient.templateData },
          priority: params.priority,
          metadata: params.metadata,
        };

        const result = await this.sendNotification(notificationParams);

        if (result.ok && result.data) {
          notifications.push(result.data);
          if (result.data.status === 'sent') {
            successful++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      }

      const batchResult: BatchResult = {
        total: params.recipients.length,
        successful,
        failed,
        notifications,
      };

      return { ok: true, data: batchResult };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'SEND_BATCH_FAILED',
          message: error.message,
        },
      };
    }
  }

  async retryNotification(notificationId: string): Promise<NotificationsEngineResult<Notification>> {
    try {
      const notification = await this.fetchNotificationById(notificationId);

      if (!notification) {
        return {
          ok: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
            details: { notificationId },
          },
        };
      }

      if (notification.status === 'sent' || notification.status === 'delivered') {
        return {
          ok: false,
          error: {
            code: 'NOTIFICATION_ALREADY_SENT',
            message: 'Notification has already been sent',
            details: { notificationId, status: notification.status },
          },
        };
      }

      if (notification.retryCount >= notification.maxRetries) {
        return {
          ok: false,
          error: {
            code: 'MAX_RETRIES_EXCEEDED',
            message: 'Maximum retry count exceeded',
            details: { notificationId, retryCount: notification.retryCount },
          },
        };
      }

      notification.retryCount++;
      notification.status = 'pending';
      notification.errorMessage = null;
      notification.updatedAt = new Date().toISOString();

      await this.storeNotification(notification);

      // Attempt to resend
      const sent = await this.sendViaProvider(notification, {});

      if (sent) {
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
      } else {
        notification.status = 'failed';
        notification.failedAt = new Date().toISOString();
        notification.errorMessage = 'Retry failed';
      }

      notification.updatedAt = new Date().toISOString();
      await this.storeNotification(notification);

      return { ok: true, data: notification };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'RETRY_NOTIFICATION_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // TEMPLATE MANAGEMENT
  // =============================================================================

  async createTemplate(params: CreateTemplateParams): Promise<NotificationsEngineResult<NotificationTemplate>> {
    try {
      if (!this.isValidKey(params.key)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_TEMPLATE_KEY',
            message: 'Template key must be alphanumeric with underscores/hyphens only',
            details: { key: params.key },
          },
        };
      }

      const now = new Date().toISOString();
      const template: NotificationTemplate = {
        id: this.generateId('template'),
        key: params.key,
        name: params.name,
        description: params.description || null,
        channel: params.channel,
        subject: params.subject || null,
        body: params.body,
        variables: params.variables || this.extractVariables(params.body),
        isActive: true,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeTemplate(template);
      this.emitTemplateCreated(template);

      return { ok: true, data: template };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_TEMPLATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  async getTemplate(templateId: string): Promise<NotificationsEngineResult<NotificationTemplate>> {
    try {
      const template = await this.fetchTemplateById(templateId);

      if (!template) {
        return {
          ok: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
            details: { templateId },
          },
        };
      }

      return { ok: true, data: template };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_TEMPLATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  async updateTemplate(
    templateId: string,
    params: UpdateTemplateParams
  ): Promise<NotificationsEngineResult<NotificationTemplate>> {
    try {
      const template = await this.fetchTemplateById(templateId);

      if (!template) {
        return {
          ok: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
            details: { templateId },
          },
        };
      }

      const updatedTemplate: NotificationTemplate = {
        ...template,
        name: params.name !== undefined ? params.name : template.name,
        description: params.description !== undefined ? params.description : template.description,
        subject: params.subject !== undefined ? params.subject : template.subject,
        body: params.body !== undefined ? params.body : template.body,
        variables: params.variables !== undefined ? params.variables : template.variables,
        isActive: params.isActive !== undefined ? params.isActive : template.isActive,
        metadata:
          params.metadata !== undefined ? { ...template.metadata, ...params.metadata } : template.metadata,
        updatedAt: new Date().toISOString(),
      };

      await this.storeTemplate(updatedTemplate);
      this.emitTemplateUpdated(template.id, template.key, params);

      return { ok: true, data: updatedTemplate };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_TEMPLATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  async renderTemplate(params: RenderTemplateParams): Promise<NotificationsEngineResult<RenderTemplateResult>> {
    try {
      const template = await this.fetchTemplateById(params.templateId);

      if (!template) {
        return {
          ok: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
            details: { templateId: params.templateId },
          },
        };
      }

      if (!template.isActive) {
        return {
          ok: false,
          error: {
            code: 'TEMPLATE_INACTIVE',
            message: 'Template is not active',
            details: { templateId: params.templateId },
          },
        };
      }

      const renderedBody = this.replaceVariables(template.body, params.data);
      const renderedSubject = template.subject ? this.replaceVariables(template.subject, params.data) : null;

      const result: RenderTemplateResult = {
        subject: renderedSubject,
        body: renderedBody,
      };

      return { ok: true, data: result };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'RENDER_TEMPLATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PROVIDER MANAGEMENT
  // =============================================================================

  async createProvider(params: CreateProviderParams): Promise<NotificationsEngineResult<NotificationProvider>> {
    try {
      const now = new Date().toISOString();
      const provider: NotificationProvider = {
        id: this.generateId('provider'),
        name: params.name,
        channel: params.channel,
        type: params.type,
        config: params.config,
        isActive: true,
        isDefault: params.isDefault || false,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeProvider(provider);
      this.providers.set(provider.id, provider);
      this.emitProviderCreated(provider);

      return { ok: true, data: provider };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_PROVIDER_FAILED',
          message: error.message,
        },
      };
    }
  }

  async updateProvider(
    providerId: string,
    params: UpdateProviderParams
  ): Promise<NotificationsEngineResult<NotificationProvider>> {
    try {
      const provider = await this.fetchProviderById(providerId);

      if (!provider) {
        return {
          ok: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found',
            details: { providerId },
          },
        };
      }

      const updatedProvider: NotificationProvider = {
        ...provider,
        name: params.name !== undefined ? params.name : provider.name,
        config: params.config !== undefined ? { ...provider.config, ...params.config } : provider.config,
        isActive: params.isActive !== undefined ? params.isActive : provider.isActive,
        isDefault: params.isDefault !== undefined ? params.isDefault : provider.isDefault,
        metadata:
          params.metadata !== undefined ? { ...provider.metadata, ...params.metadata } : provider.metadata,
        updatedAt: new Date().toISOString(),
      };

      await this.storeProvider(updatedProvider);
      this.providers.set(updatedProvider.id, updatedProvider);
      this.emitProviderUpdated(provider.id, provider.name, params);

      return { ok: true, data: updatedProvider };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_PROVIDER_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // DELIVERY TRACKING
  // =============================================================================

  async recordDeliveryEvent(params: RecordDeliveryEventParams): Promise<NotificationsEngineResult<DeliveryEvent>> {
    try {
      const now = new Date().toISOString();
      const event: DeliveryEvent = {
        id: this.generateId('event'),
        notificationId: params.notificationId,
        eventType: params.eventType,
        timestamp: now,
        providerEventId: params.providerEventId || null,
        metadata: params.metadata || {},
        createdAt: now,
      };

      await this.storeDeliveryEvent(event);

      // Update notification status based on event type
      if (params.eventType === 'delivered') {
        const notification = await this.fetchNotificationById(params.notificationId);
        if (notification) {
          notification.status = 'delivered';
          notification.deliveredAt = now;
          notification.updatedAt = now;
          await this.storeNotification(notification);
          this.emitNotificationDelivered(notification);
        }
      }

      return { ok: true, data: event };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'RECORD_DELIVERY_EVENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  async getNotificationHistory(
    params: GetNotificationHistoryParams
  ): Promise<NotificationsEngineResult<DeliveryEvent[]>> {
    try {
      const events = await this.fetchDeliveryEventsByNotification(params.notificationId);
      return { ok: true, data: events };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_NOTIFICATION_HISTORY_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async sendEmailFromParams(params: SendNotificationParams): Promise<NotificationsEngineResult<Notification>> {
    return await this.sendEmail({
      to: params.recipientAddress,
      subject: params.subject || 'Notification',
      body: params.body || '',
      templateId: params.templateId,
      templateData: params.templateData,
      metadata: params.metadata,
    });
  }

  private async sendSMSFromParams(params: SendNotificationParams): Promise<NotificationsEngineResult<Notification>> {
    return await this.sendSMS({
      to: params.recipientAddress,
      body: params.body || '',
      templateId: params.templateId,
      templateData: params.templateData,
      metadata: params.metadata,
    });
  }

  private async sendPushFromParams(params: SendNotificationParams): Promise<NotificationsEngineResult<Notification>> {
    return await this.sendPush({
      to: params.recipientAddress,
      title: params.subject || 'Notification',
      body: params.body || '',
      templateId: params.templateId,
      templateData: params.templateData,
      metadata: params.metadata,
    });
  }

  private async sendWebhookFromParams(params: SendNotificationParams): Promise<NotificationsEngineResult<Notification>> {
    return await this.sendWebhook({
      url: params.recipientAddress,
      body: params.body ? JSON.parse(params.body) : {},
      metadata: params.metadata,
    });
  }

  private isValidKey(key: string): boolean {
    return /^[a-zA-Z0-9_.-]+$/.test(key);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private extractVariables(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  private replaceVariables(template: string, data: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  private async getProviderForChannel(channel: NotificationChannel): Promise<NotificationProvider | null> {
    // Find default provider for channel
    for (const provider of this.providers.values()) {
      if (provider.channel === channel && provider.isDefault && provider.isActive) {
        return provider;
      }
    }

    // Fallback to first active provider for channel
    for (const provider of this.providers.values()) {
      if (provider.channel === channel && provider.isActive) {
        return provider;
      }
    }

    return null;
  }

  private async sendViaProvider(notification: Notification, _params: any): Promise<boolean> {
    console.log('[NotificationsEngine] Send via provider:', notification.channel, notification.id);
    // This is a stub that would integrate with actual providers (SendGrid, Twilio, etc.)
    // For now, we'll simulate successful sending
    return true;
  }

  private async loadProviders(): Promise<void> {
    console.log('[NotificationsEngine] Loading providers from database');
    const providers = await this.fetchProviders();
    for (const provider of providers) {
      this.providers.set(provider.id, provider);
    }
  }

  // Database stubs
  private async storeNotification(notification: Notification): Promise<void> {
    console.log('[NotificationsEngine] Store notification:', notification.id);
  }

  private async fetchNotificationById(notificationId: string): Promise<Notification | null> {
    console.log('[NotificationsEngine] Fetch notification by ID:', notificationId);
    return null;
  }

  private async storeTemplate(template: NotificationTemplate): Promise<void> {
    console.log('[NotificationsEngine] Store template:', template.id);
  }

  private async fetchTemplateById(templateId: string): Promise<NotificationTemplate | null> {
    console.log('[NotificationsEngine] Fetch template by ID:', templateId);
    return null;
  }

  private async storeProvider(provider: NotificationProvider): Promise<void> {
    console.log('[NotificationsEngine] Store provider:', provider.id);
  }

  private async fetchProviderById(providerId: string): Promise<NotificationProvider | null> {
    console.log('[NotificationsEngine] Fetch provider by ID:', providerId);
    return null;
  }

  private async fetchProviders(): Promise<NotificationProvider[]> {
    console.log('[NotificationsEngine] Fetch all providers');
    return [];
  }

  private async storeDeliveryEvent(event: DeliveryEvent): Promise<void> {
    console.log('[NotificationsEngine] Store delivery event:', event.id);
  }

  private async fetchDeliveryEventsByNotification(notificationId: string): Promise<DeliveryEvent[]> {
    console.log('[NotificationsEngine] Fetch delivery events for notification:', notificationId);
    return [];
  }

  // Event emitters
  private emitEmailSent(notification: Notification, subject: string): void {
    const payload: EmailSentEvent = {
      notificationId: notification.id,
      channel: 'email',
      recipientId: notification.recipientId,
      recipientAddress: notification.recipientAddress,
      subject,
      templateId: notification.templateId,
      status: notification.status,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.email.sent', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit email.sent event:', error);
      });
    });
  }

  private emitSMSSent(notification: Notification): void {
    const payload: SMSSentEvent = {
      notificationId: notification.id,
      channel: 'sms',
      recipientId: notification.recipientId,
      recipientAddress: notification.recipientAddress,
      bodyLength: notification.body.length,
      status: notification.status,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.sms.sent', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit sms.sent event:', error);
      });
    });
  }

  private emitPushSent(notification: Notification, title: string): void {
    const payload: PushSentEvent = {
      notificationId: notification.id,
      channel: 'push',
      recipientId: notification.recipientId,
      recipientAddress: notification.recipientAddress,
      title,
      status: notification.status,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.push.sent', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit push.sent event:', error);
      });
    });
  }

  private emitWebhookSent(notification: Notification, url: string, method: string, statusCode: number | null): void {
    const payload: WebhookSentEvent = {
      notificationId: notification.id,
      channel: 'webhook',
      recipientId: notification.recipientId,
      recipientAddress: notification.recipientAddress,
      url,
      method,
      statusCode,
      status: notification.status,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.webhook.sent', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit webhook.sent event:', error);
      });
    });
  }

  private emitNotificationDelivered(notification: Notification): void {
    const payload: NotificationDeliveredEvent = {
      notificationId: notification.id,
      channel: notification.channel,
      recipientAddress: notification.recipientAddress,
      deliveredAt: notification.deliveredAt!,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.delivered', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit delivered event:', error);
      });
    });
  }

  private emitNotificationFailed(notification: Notification): void {
    const payload: NotificationFailedEvent = {
      notificationId: notification.id,
      channel: notification.channel,
      recipientAddress: notification.recipientAddress,
      errorMessage: notification.errorMessage || 'Unknown error',
      retryCount: notification.retryCount,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.failed', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit failed event:', error);
      });
    });
  }

  private emitTemplateCreated(template: NotificationTemplate): void {
    const payload: TemplateCreatedEvent = {
      templateId: template.id,
      templateKey: template.key,
      channel: template.channel,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.template.created', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit template.created event:', error);
      });
    });
  }

  private emitTemplateUpdated(templateId: string, templateKey: string, changes: UpdateTemplateParams): void {
    const payload: TemplateUpdatedEvent = {
      templateId,
      templateKey,
      changes,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.template.updated', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit template.updated event:', error);
      });
    });
  }

  private emitProviderCreated(provider: NotificationProvider): void {
    const payload: ProviderCreatedEvent = {
      providerId: provider.id,
      providerName: provider.name,
      channel: provider.channel,
      type: provider.type,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.provider.created', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit provider.created event:', error);
      });
    });
  }

  private emitProviderUpdated(providerId: string, providerName: string, changes: UpdateProviderParams): void {
    const payload: ProviderUpdatedEvent = {
      providerId,
      providerName,
      changes,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('notifications.provider.updated', payload).catch((error: any) => {
        console.error('[NotificationsEngine] Failed to emit provider.updated event:', error);
      });
    });
  }
}

export type { NotificationsEngineConfig };
