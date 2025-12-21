/**
 * NotificationsEngine Types
 *
 * Complete type definitions for the NotificationsEngine.
 * Multi-channel notification delivery (email, SMS, push, webhooks).
 */

// =============================================================================
// NOTIFICATION CHANNEL TYPES
// =============================================================================

export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook';

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'cancelled';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export interface Notification {
  id: string;
  channel: NotificationChannel;
  recipientId: string | null;
  recipientAddress: string;
  subject: string | null;
  body: string;
  templateId: string | null;
  templateData: Record<string, any>;
  status: NotificationStatus;
  priority: NotificationPriority;
  providerId: string | null;
  providerMessageId: string | null;
  scheduledFor: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationParams {
  channel: NotificationChannel;
  recipientId?: string;
  recipientAddress: string;
  subject?: string;
  body?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledFor?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  encoding?: string;
}

export interface SendSMSParams {
  to: string;
  body: string;
  from?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SendPushParams {
  to: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: number;
  sound?: string;
  data?: Record<string, any>;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SendWebhookParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryCount?: number;
  metadata?: Record<string, any>;
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

export interface NotificationTemplate {
  id: string;
  key: string;
  name: string;
  description: string | null;
  channel: NotificationChannel;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateParams {
  key: string;
  name: string;
  description?: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTemplateParams {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface RenderTemplateParams {
  templateId: string;
  data: Record<string, any>;
}

export interface RenderTemplateResult {
  subject: string | null;
  body: string;
}

// =============================================================================
// PROVIDER TYPES
// =============================================================================

export interface NotificationProvider {
  id: string;
  name: string;
  channel: NotificationChannel;
  type: ProviderType;
  config: ProviderConfig;
  isActive: boolean;
  isDefault: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type ProviderType =
  | 'sendgrid'
  | 'ses'
  | 'mailgun'
  | 'twilio'
  | 'vonage'
  | 'fcm'
  | 'apns'
  | 'custom';

export interface ProviderConfig {
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  region?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface CreateProviderParams {
  name: string;
  channel: NotificationChannel;
  type: ProviderType;
  config: ProviderConfig;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateProviderParams {
  name?: string;
  config?: ProviderConfig;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

// =============================================================================
// DELIVERY TRACKING TYPES
// =============================================================================

export interface DeliveryEvent {
  id: string;
  notificationId: string;
  eventType: DeliveryEventType;
  timestamp: string;
  providerEventId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export type DeliveryEventType =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'spam'
  | 'unsubscribed';

export interface RecordDeliveryEventParams {
  notificationId: string;
  eventType: DeliveryEventType;
  providerEventId?: string;
  metadata?: Record<string, any>;
}

export interface GetNotificationHistoryParams {
  notificationId: string;
}

// =============================================================================
// BATCH OPERATIONS TYPES
// =============================================================================

export interface SendBatchParams {
  channel: NotificationChannel;
  recipients: BatchRecipient[];
  subject?: string;
  body?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface BatchRecipient {
  recipientId?: string;
  recipientAddress: string;
  templateData?: Record<string, any>;
}

export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  notifications: Notification[];
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

export interface NotificationsEngineConfig {
  enabled: boolean;
  defaultRetryCount: number;
  retryDelaySeconds: number;
  maxBatchSize: number;
  enableDeliveryTracking: boolean;
  defaultProvider: {
    email?: string;
    sms?: string;
    push?: string;
    webhook?: string;
  };
}

// =============================================================================
// ENGINE RESULT TYPES
// =============================================================================

export interface NotificationsEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: NotificationsEngineError;
}

export interface NotificationsEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// =============================================================================
// EVENT PAYLOAD TYPES
// =============================================================================

export interface NotificationSentEvent {
  notificationId: string;
  channel: NotificationChannel;
  recipientId: string | null;
  recipientAddress: string;
  status: NotificationStatus;
  timestamp: string;
}

export interface EmailSentEvent extends NotificationSentEvent {
  channel: 'email';
  subject: string;
  templateId: string | null;
}

export interface SMSSentEvent extends NotificationSentEvent {
  channel: 'sms';
  bodyLength: number;
}

export interface PushSentEvent extends NotificationSentEvent {
  channel: 'push';
  title: string;
}

export interface WebhookSentEvent extends NotificationSentEvent {
  channel: 'webhook';
  url: string;
  method: string;
  statusCode: number | null;
}

export interface NotificationDeliveredEvent {
  notificationId: string;
  channel: NotificationChannel;
  recipientAddress: string;
  deliveredAt: string;
  timestamp: string;
}

export interface NotificationFailedEvent {
  notificationId: string;
  channel: NotificationChannel;
  recipientAddress: string;
  errorMessage: string;
  retryCount: number;
  timestamp: string;
}

export interface TemplateCreatedEvent {
  templateId: string;
  templateKey: string;
  channel: NotificationChannel;
  timestamp: string;
}

export interface TemplateUpdatedEvent {
  templateId: string;
  templateKey: string;
  changes: Partial<UpdateTemplateParams>;
  timestamp: string;
}

export interface ProviderCreatedEvent {
  providerId: string;
  providerName: string;
  channel: NotificationChannel;
  type: ProviderType;
  timestamp: string;
}

export interface ProviderUpdatedEvent {
  providerId: string;
  providerName: string;
  changes: Partial<UpdateProviderParams>;
  timestamp: string;
}
