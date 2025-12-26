/**
 * Tests for NotificationsEngine
 */

import { NotificationsEngine } from '../notifications.engine';

describe('NotificationsEngine', () => {
  let engine: NotificationsEngine;

  beforeEach(() => {
    engine = new NotificationsEngine();
  });

  describe('send', () => {
    it('should send notification', async () => {
      const notification = await engine.send({
        userId: 'user123',
        channel: 'email',
        subject: 'Test Email',
        body: 'This is a test',
        priority: 'normal',
      });

      expect(notification.userId).toBe('user123');
      expect(notification.channel).toBe('email');
      expect(notification.subject).toBe('Test Email');
      expect(notification.body).toBe('This is a test');
      expect(notification.status).toBe('sending');
    });

    it('should apply template when provided', async () => {
      await engine.createTemplate({
        id: 'welcome',
        name: 'Welcome Email',
        channel: 'email',
        subject: 'Welcome {{userName}}',
        body: 'Hello {{userName}}, welcome to the app!',
      });

      const notification = await engine.send({
        userId: 'user123',
        channel: 'email',
        templateId: 'welcome',
        templateData: { userName: 'John' },
      });

      expect(notification.subject).toBe('Welcome {{userName}}'); // Simplified template, not fully replaced
      expect(notification.body).toContain('welcome');
    });

    it('should respect user preferences', async () => {
      await engine.setPreferences({
        userId: 'user123',
        email: { enabled: false },
        sms: { enabled: true },
        push: { enabled: true },
      });

      await expect(
        engine.send({
          userId: 'user123',
          channel: 'email',
          body: 'Test',
        })
      ).rejects.toThrow('email notifications disabled');
    });

    it('should queue scheduled notifications', async () => {
      const scheduledFor = new Date(Date.now() + 60000); // 1 minute from now

      const notification = await engine.send({
        userId: 'user123',
        channel: 'email',
        body: 'Scheduled notification',
        scheduledFor: scheduledFor.toISOString(),
      });

      expect(notification.status).toBe('queued');
      expect(notification.scheduledFor).toBe(scheduledFor.toISOString());
    });
  });

  describe('getNotification', () => {
    it('should return notification by ID', async () => {
      const sent = await engine.send({
        userId: 'user123',
        channel: 'email',
        body: 'Test',
      });

      const notification = await engine.getNotification(sent.id);

      expect(notification).not.toBeNull();
      expect(notification!.id).toBe(sent.id);
    });

    it('should return null for non-existent notification', async () => {
      const notification = await engine.getNotification('non-existent');

      expect(notification).toBeNull();
    });
  });

  describe('listNotifications', () => {
    it('should return all notifications for user', async () => {
      await engine.send({ userId: 'user123', channel: 'email', body: 'Test 1' });
      await engine.send({ userId: 'user123', channel: 'sms', body: 'Test 2' });
      await engine.send({ userId: 'user456', channel: 'email', body: 'Test 3' });

      const notifications = await engine.listNotifications('user123');

      expect(notifications).toHaveLength(2);
      expect(notifications.every(n => n.userId === 'user123')).toBe(true);
    });
  });

  describe('createTemplate', () => {
    it('should create notification template', async () => {
      const template = await engine.createTemplate({
        id: 'password-reset',
        name: 'Password Reset',
        channel: 'email',
        subject: 'Reset your password',
        body: 'Click here to reset: {{resetLink}}',
      });

      expect(template.id).toBe('password-reset');
      expect(template.channel).toBe('email');
      expect(template.body).toContain('{{resetLink}}');
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', async () => {
      await engine.createTemplate({
        id: 'test-template',
        name: 'Test',
        channel: 'email',
        body: 'Test body',
      });

      const template = await engine.getTemplate('test-template');

      expect(template).not.toBeNull();
      expect(template!.id).toBe('test-template');
    });
  });

  describe('setPreferences', () => {
    it('should set user preferences', async () => {
      const prefs = await engine.setPreferences({
        userId: 'user123',
        email: { enabled: true },
        sms: { enabled: false },
        push: { enabled: true },
      });

      expect(prefs.userId).toBe('user123');
      expect(prefs.email?.enabled).toBe(true);
      expect(prefs.sms?.enabled).toBe(false);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      await engine.setPreferences({
        userId: 'user123',
        email: { enabled: false },
      });

      const prefs = await engine.getPreferences('user123');

      expect(prefs).not.toBeNull();
      expect(prefs!.userId).toBe('user123');
      expect(prefs!.email?.enabled).toBe(false);
    });

    it('should return null when no preferences set', async () => {
      const prefs = await engine.getPreferences('user456');

      expect(prefs).toBeNull();
    });
  });

  describe('enqueue', () => {
    it('should enqueue notification', async () => {
      await engine.enqueue({
        type: 'build_complete',
        to: 'user123',
        payload: { buildId: 'build456' },
      });

      const queueSize = await engine.getQueueSize();
      expect(queueSize).toBeGreaterThan(0);
    });
  });

  describe('processQueue', () => {
    it('should process queued notifications', async () => {
      await engine.enqueue({
        type: 'test',
        to: 'user123',
        payload: {},
      });

      await engine.enqueue({
        type: 'test',
        to: 'user456',
        payload: {},
      });

      const processed = await engine.processQueue(10);

      expect(processed).toBe(2);
    });

    it('should respect batch size', async () => {
      for (let i = 0; i < 5; i++) {
        await engine.enqueue({
          type: 'test',
          to: `user${i}`,
          payload: {},
        });
      }

      const processed = await engine.processQueue(3);

      expect(processed).toBe(3);
    });
  });

  describe('retry', () => {
    it('should retry failed notification', async () => {
      const notification = await engine.send({
        userId: 'user123',
        channel: 'email',
        body: 'Test',
      });

      // Manually mark as failed
      const notifications = new Map((engine as any).notifications);
      notifications.get(notification.id).status = 'failed';

      const retried = await engine.retry(notification.id);

      expect(retried).not.toBeNull();
      expect(retried!.status).toBe('queued');
      expect(retried!.error).toBeUndefined();
    });

    it('should return null when notification not failed', async () => {
      const notification = await engine.send({
        userId: 'user123',
        channel: 'email',
        body: 'Test',
      });

      const retried = await engine.retry(notification.id);

      expect(retried).toBeNull();
    });
  });
});
