/**
 * NotificationsEngine™ Types
 */

export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationStatus = 'queued' | 'sending' | 'sent' | 'failed';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  priority: NotificationPriority;
  subject?: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  scheduledFor?: string;
  sentAt?: string;
  failedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  channel: NotificationChannel;
  name: string;
  subject?: string;
  body: string;
  variables: string[];
}

export interface NotificationPreferences {
  userId: string;
  email?: {
    enabled: boolean;
    address?: string;
  };
  sms?: {
    enabled: boolean;
    phoneNumber?: string;
  };
  push?: {
    enabled: boolean;
    deviceTokens?: string[];
  };
}

export interface SendNotificationParams {
  userId: string;
  channel: NotificationChannel;
  body: string;
  subject?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  priority?: NotificationPriority;
  scheduledFor?: string;
  metadata?: Record<string, unknown>;
}
