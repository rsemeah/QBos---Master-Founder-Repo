/**
 * NotificationsEngine™ - Email, SMS, and Push Notifications
 */
import type { Notification, NotificationTemplate, NotificationPreferences, SendNotificationParams } from './types';
export declare class NotificationsEngine {
    private notifications;
    private templates;
    private preferences;
    private queue;
    /**
     * Send notification
     */
    send(params: SendNotificationParams): Promise<Notification>;
    /**
     * Get notification status
     */
    getNotification(notificationId: string): Promise<Notification | null>;
    /**
     * List user notifications
     */
    listNotifications(userId: string): Promise<Notification[]>;
    /**
     * Create notification template
     */
    createTemplate(template: NotificationTemplate): Promise<NotificationTemplate>;
    /**
     * Get template
     */
    getTemplate(templateId: string): Promise<NotificationTemplate | null>;
    /**
     * Set user notification preferences
     */
    setPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences>;
    /**
     * Get user notification preferences
     */
    getPreferences(userId: string): Promise<NotificationPreferences | null>;
    /**
     * Enqueue notification (simplified for orchestration)
     */
    enqueue(params: {
        type: string;
        to: string;
        payload: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Get queue size
     */
    getQueueSize(): Promise<number>;
    /**
     * Process queue (would be called by background job)
     */
    processQueue(batchSize?: number): Promise<number>;
    /**
     * Retry failed notification
     */
    retry(notificationId: string): Promise<Notification | null>;
    private isChannelEnabled;
    private applyTemplate;
    private simulateSend;
}
//# sourceMappingURL=notifications.engine.d.ts.map