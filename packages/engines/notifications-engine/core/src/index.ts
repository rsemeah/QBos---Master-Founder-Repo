/**
 * @qbos/notifications-engine-core - NotificationsEngine™ Core Package
 *
 * Multi-channel notification delivery for QuietBuild OS.
 *
 * Usage:
 *
 * ```typescript
 * import { NotificationsEngine } from '@qbos/notifications-engine-core';
 * import { InMemoryEventBus } from '@qbos/events';
 *
 * const eventBus = new InMemoryEventBus();
 * const notificationsEngine = new NotificationsEngine({
 *   enabled: true,
 *   defaultRetryCount: 3,
 *   enableDeliveryTracking: true,
 * }, eventBus);
 *
 * await notificationsEngine.init();
 *
 * // Send email
 * await notificationsEngine.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   body: 'Welcome to our platform',
 * });
 *
 * // Send SMS
 * await notificationsEngine.sendSMS({
 *   to: '+1234567890',
 *   body: 'Your verification code is 123456',
 * });
 *
 * // Send push notification
 * await notificationsEngine.sendPush({
 *   to: 'device_token_123',
 *   title: 'New Message',
 *   body: 'You have a new message',
 * });
 * ```
 */

// Main engine class
export { NotificationsEngine } from './notifications.engine';
export type { NotificationsEngineConfig } from './notifications.engine';

// All types
export type {
  // Channel and status types
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,

  // Notification types
  Notification,
  SendNotificationParams,
  SendEmailParams,
  EmailAttachment,
  SendSMSParams,
  SendPushParams,
  SendWebhookParams,

  // Template types
  NotificationTemplate,
  CreateTemplateParams,
  UpdateTemplateParams,
  RenderTemplateParams,
  RenderTemplateResult,

  // Provider types
  NotificationProvider,
  ProviderType,
  ProviderConfig,
  CreateProviderParams,
  UpdateProviderParams,

  // Delivery tracking types
  DeliveryEvent,
  DeliveryEventType,
  RecordDeliveryEventParams,
  GetNotificationHistoryParams,

  // Batch operations types
  SendBatchParams,
  BatchRecipient,
  BatchResult,

  // Result types
  NotificationsEngineResult,
  NotificationsEngineError,

  // Event payload types
  NotificationSentEvent,
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
} from './types';
