/**
 * NotificationsEngine™ - Email, SMS, and Push Notifications
 */

import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate,
  NotificationPreferences,
  SendNotificationParams,
} from './types';

export class NotificationsEngine {
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private queue: string[] = [];

  /**
   * Send notification
   */
  async send(params: SendNotificationParams): Promise<Notification> {
    // Check user preferences
    const prefs = this.preferences.get(params.userId);
    if (prefs && !this.isChannelEnabled(prefs, params.channel)) {
      throw new Error(`${params.channel} notifications disabled for user`);
    }

    let body = params.body;
    let subject = params.subject;

    // Apply template if provided
    if (params.templateId) {
      const template = this.templates.get(params.templateId);
      if (template) {
        body = this.applyTemplate(template.body, params.templateData || {});
        subject = template.subject
          ? this.applyTemplate(template.subject, params.templateData || {})
          : subject;
      }
    }

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: params.userId,
      channel: params.channel,
      status: params.scheduledFor ? 'queued' : 'sending',
      priority: params.priority || 'normal',
      subject,
      body,
      templateId: params.templateId,
      templateData: params.templateData,
      scheduledFor: params.scheduledFor,
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
    };

    this.notifications.set(notification.id, notification);

    // Add to queue for processing
    if (!notification.scheduledFor || new Date(notification.scheduledFor) <= new Date()) {
      this.queue.push(notification.id);
    }

    // In real implementation, would trigger actual sending
    // For now, simulate immediate success
    this.simulateSend(notification.id);

    return notification;
  }

  /**
   * Get notification status
   */
  async getNotification(notificationId: string): Promise<Notification | null> {
    return this.notifications.get(notificationId) || null;
  }

  /**
   * List user notifications
   */
  async listNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter((n) => n.userId === userId);
  }

  /**
   * Create notification template
   */
  async createTemplate(template: NotificationTemplate): Promise<NotificationTemplate> {
    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Get template
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * Set user notification preferences
   */
  async setPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    this.preferences.set(preferences.userId, preferences);
    return preferences;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    return this.preferences.get(userId) || null;
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    return this.queue.length;
  }

  /**
   * Process queue (would be called by background job)
   */
  async processQueue(batchSize: number = 10): Promise<number> {
    const batch = this.queue.splice(0, batchSize);

    for (const notificationId of batch) {
      await this.simulateSend(notificationId);
    }

    return batch.length;
  }

  /**
   * Retry failed notification
   */
  async retry(notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.status !== 'failed') {
      return null;
    }

    const updated: Notification = {
      ...notification,
      status: 'queued',
      error: undefined,
    };

    this.notifications.set(notificationId, updated);
    this.queue.push(notificationId);

    return updated;
  }

  // Private helper methods

  private isChannelEnabled(prefs: NotificationPreferences, channel: NotificationChannel): boolean {
    switch (channel) {
      case 'email':
        return prefs.email?.enabled ?? true;
      case 'sms':
        return prefs.sms?.enabled ?? true;
      case 'push':
        return prefs.push?.enabled ?? true;
      default:
        return false;
    }
  }

  private applyTemplate(template: string, data: Record<string, unknown>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }
    return result;
  }

  private async simulateSend(notificationId: string): Promise<void> {
    // Simulate async sending
    setTimeout(() => {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        const updated: Notification = {
          ...notification,
          status: 'sent',
          sentAt: new Date().toISOString(),
        };
        this.notifications.set(notificationId, updated);
      }
    }, 100);
  }
}
