# NotificationsEngine™

**Multi-Channel Notification Delivery for QuietBuild OS**

NotificationsEngine™ provides comprehensive notification delivery capabilities across multiple channels including email, SMS, push notifications, and webhooks. Built with provider abstraction, template management, delivery tracking, and automatic retry logic.

## Features

- **Multi-Channel Support** - Email, SMS, push notifications, and webhooks
- **Provider Abstraction** - Support for SendGrid, Twilio, FCM, APNS, and custom providers
- **Template Management** - Create, manage, and render notification templates
- **Delivery Tracking** - Track notification lifecycle from send to delivery
- **Retry Logic** - Automatic retry with configurable limits
- **Batch Sending** - Send notifications to multiple recipients efficiently
- **Event-Driven** - Emits events for all notification operations
- **Product-Agnostic** - Generic notification layer

## Installation

```bash
pnpm install @qbos/notifications-engine-core
```

## Quick Start

### 1. Basic Setup

```typescript
import { NotificationsEngine } from '@qbos/notifications-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const notificationsEngine = new NotificationsEngine({
  enabled: true,
  defaultRetryCount: 3,
  retryDelaySeconds: 60,
  maxBatchSize: 1000,
  enableDeliveryTracking: true,
  defaultProvider: {
    email: 'sendgrid',
    sms: 'twilio',
    push: 'fcm',
  },
}, eventBus);

await notificationsEngine.init();
```

### 2. Send Email Notifications

```typescript
// Simple email
await notificationsEngine.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Our Platform',
  body: 'Thank you for joining us!',
});

// HTML email with template
await notificationsEngine.sendEmail({
  to: 'user@example.com',
  subject: 'Password Reset',
  body: 'Click the link to reset your password',
  html: '<h1>Password Reset</h1><p>Click <a href="...">here</a></p>',
  templateId: 'password_reset',
  templateData: {
    userName: 'John Doe',
    resetLink: 'https://example.com/reset/token123',
  },
});

// Email with attachments
await notificationsEngine.sendEmail({
  to: 'user@example.com',
  subject: 'Invoice #12345',
  body: 'Please find your invoice attached',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: Buffer.from('...'),
      contentType: 'application/pdf',
    },
  ],
});
```

### 3. Send SMS Notifications

```typescript
// Simple SMS
await notificationsEngine.sendSMS({
  to: '+1234567890',
  body: 'Your verification code is 123456',
});

// SMS with template
await notificationsEngine.sendSMS({
  to: '+1234567890',
  templateId: 'verification_code',
  templateData: {
    code: '123456',
    expiresIn: '10 minutes',
  },
});
```

### 4. Send Push Notifications

```typescript
// Simple push notification
await notificationsEngine.sendPush({
  to: 'device_token_abc123',
  title: 'New Message',
  body: 'You have a new message from John',
});

// Rich push notification
await notificationsEngine.sendPush({
  to: 'device_token_abc123',
  title: 'Order Shipped',
  body: 'Your order #12345 has been shipped',
  icon: 'https://example.com/icon.png',
  image: 'https://example.com/product.jpg',
  badge: 5,
  sound: 'notification.mp3',
  data: {
    orderId: '12345',
    trackingNumber: 'TRACK123',
  },
});
```

### 5. Send Webhook Notifications

```typescript
// POST webhook
await notificationsEngine.sendWebhook({
  url: 'https://example.com/webhook',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token123',
    'Content-Type': 'application/json',
  },
  body: {
    event: 'user.created',
    userId: 'user_123',
    timestamp: new Date().toISOString(),
  },
});

// Webhook with retry
await notificationsEngine.sendWebhook({
  url: 'https://example.com/webhook',
  method: 'POST',
  body: { event: 'payment.succeeded' },
  timeout: 5000,
  retryCount: 5,
});
```

## Template Management

### Create Templates

```typescript
// Email template
await notificationsEngine.createTemplate({
  key: 'welcome_email',
  name: 'Welcome Email',
  description: 'Sent when a new user signs up',
  channel: 'email',
  subject: 'Welcome to {{appName}}, {{userName}}!',
  body: `
    Hi {{userName}},

    Welcome to {{appName}}! We're excited to have you.

    Click here to get started: {{onboardingUrl}}

    Best regards,
    The {{appName}} Team
  `,
  variables: ['appName', 'userName', 'onboardingUrl'],
});

// SMS template
await notificationsEngine.createTemplate({
  key: 'verification_code',
  name: 'SMS Verification Code',
  channel: 'sms',
  body: 'Your {{appName}} verification code is {{code}}. Expires in {{expiresIn}}.',
  variables: ['appName', 'code', 'expiresIn'],
});
```

### Render Templates

```typescript
const rendered = await notificationsEngine.renderTemplate({
  templateId: 'welcome_email',
  data: {
    appName: 'MyApp',
    userName: 'John Doe',
    onboardingUrl: 'https://myapp.com/onboard',
  },
});

if (rendered.ok) {
  console.log('Subject:', rendered.data!.subject);
  console.log('Body:', rendered.data!.body);
}
```

### Update Templates

```typescript
await notificationsEngine.updateTemplate(templateId, {
  body: 'Updated template body with {{newVariable}}',
  variables: ['appName', 'userName', 'onboardingUrl', 'newVariable'],
  isActive: true,
});
```

## Provider Management

### Add Notification Providers

```typescript
// SendGrid for email
await notificationsEngine.createProvider({
  name: 'SendGrid',
  channel: 'email',
  type: 'sendgrid',
  config: {
    apiKey: process.env.SENDGRID_API_KEY,
    defaultFrom: 'noreply@example.com',
  },
  isDefault: true,
});

// Twilio for SMS
await notificationsEngine.createProvider({
  name: 'Twilio',
  channel: 'sms',
  type: 'twilio',
  config: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: '+1234567890',
  },
  isDefault: true,
});

// FCM for push notifications
await notificationsEngine.createProvider({
  name: 'Firebase Cloud Messaging',
  channel: 'push',
  type: 'fcm',
  config: {
    serverKey: process.env.FCM_SERVER_KEY,
    projectId: process.env.FCM_PROJECT_ID,
  },
  isDefault: true,
});

// Custom webhook provider
await notificationsEngine.createProvider({
  name: 'Custom Webhook',
  channel: 'webhook',
  type: 'custom',
  config: {
    endpoint: 'https://custom-provider.com/api',
    apiKey: process.env.CUSTOM_API_KEY,
  },
  isDefault: true,
});
```

## Batch Operations

### Send to Multiple Recipients

```typescript
// Batch email send
const result = await notificationsEngine.sendBatch({
  channel: 'email',
  recipients: [
    { recipientAddress: 'user1@example.com', templateData: { userName: 'Alice' } },
    { recipientAddress: 'user2@example.com', templateData: { userName: 'Bob' } },
    { recipientAddress: 'user3@example.com', templateData: { userName: 'Charlie' } },
  ],
  templateId: 'welcome_email',
  templateData: {
    appName: 'MyApp',
    onboardingUrl: 'https://myapp.com/onboard',
  },
});

if (result.ok) {
  console.log(`Sent: ${result.data!.successful}/${result.data!.total}`);
  console.log(`Failed: ${result.data!.failed}`);
}
```

## Delivery Tracking

### Track Notification Status

```typescript
// Send notification
const notification = await notificationsEngine.sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  body: 'Test notification',
});

// Record delivery events
await notificationsEngine.recordDeliveryEvent({
  notificationId: notification.data!.id,
  eventType: 'delivered',
  providerEventId: 'provider_event_123',
});

await notificationsEngine.recordDeliveryEvent({
  notificationId: notification.data!.id,
  eventType: 'opened',
  metadata: {
    userAgent: 'Mozilla/5.0...',
    ipAddress: '192.168.1.1',
  },
});

// Get notification history
const history = await notificationsEngine.getNotificationHistory({
  notificationId: notification.data!.id,
});

if (history.ok) {
  for (const event of history.data!) {
    console.log(`${event.eventType} at ${event.timestamp}`);
  }
}
```

## Retry Failed Notifications

```typescript
// Retry a failed notification
const result = await notificationsEngine.retryNotification(notificationId);

if (result.ok) {
  console.log('Retry successful');
  console.log('Status:', result.data!.status);
  console.log('Retry count:', result.data!.retryCount);
} else {
  console.error('Retry failed:', result.error?.message);
}
```

## Configuration

### NotificationsEngineConfig

```typescript
interface NotificationsEngineConfig {
  enabled: boolean;                  // Enable/disable engine (default: true)
  defaultRetryCount: number;         // Default retry attempts (default: 3)
  retryDelaySeconds: number;         // Delay between retries (default: 60)
  maxBatchSize: number;              // Max batch size (default: 1000)
  enableDeliveryTracking: boolean;   // Enable tracking (default: true)
  defaultProvider: {                 // Default providers per channel
    email?: string;
    sms?: string;
    push?: string;
    webhook?: string;
  };
}
```

## Events

### Events Emitted

- **`notifications.email.sent`** - Email notification sent
- **`notifications.sms.sent`** - SMS notification sent
- **`notifications.push.sent`** - Push notification sent
- **`notifications.webhook.sent`** - Webhook notification sent
- **`notifications.delivered`** - Notification delivered to recipient
- **`notifications.failed`** - Notification failed to send
- **`notifications.template.created`** - Template created
- **`notifications.template.updated`** - Template updated
- **`notifications.provider.created`** - Provider created
- **`notifications.provider.updated`** - Provider updated

### Subscribing to Events

```typescript
// Track email sends
eventBus.on('notifications.email.sent', async (event) => {
  console.log(`Email sent to ${event.recipientAddress}`);
  console.log(`Subject: ${event.subject}`);

  // Log to analytics
  await analytics.track({
    event: 'email_sent',
    properties: {
      notificationId: event.notificationId,
      recipientAddress: event.recipientAddress,
      subject: event.subject,
    },
  });
});

// Track delivery
eventBus.on('notifications.delivered', async (event) => {
  console.log(`Notification ${event.notificationId} delivered`);

  // Update user engagement metrics
  await metrics.increment('notifications.delivered', {
    channel: event.channel,
  });
});

// Handle failures
eventBus.on('notifications.failed', async (event) => {
  console.error(`Notification ${event.notificationId} failed: ${event.errorMessage}`);

  // Alert if max retries exceeded
  if (event.retryCount >= 3) {
    await alerts.send({
      severity: 'error',
      message: `Notification failed after ${event.retryCount} retries`,
      context: { notificationId: event.notificationId },
    });
  }
});
```

## API Reference

### Notification Sending

- `sendNotification(params)` - Send notification via any channel
- `sendEmail(params)` - Send email notification
- `sendSMS(params)` - Send SMS notification
- `sendPush(params)` - Send push notification
- `sendWebhook(params)` - Send webhook notification
- `sendBatch(params)` - Send batch notifications
- `retryNotification(notificationId)` - Retry failed notification

### Template Management

- `createTemplate(params)` - Create notification template
- `getTemplate(templateId)` - Get template by ID
- `updateTemplate(templateId, params)` - Update template
- `renderTemplate(params)` - Render template with data

### Provider Management

- `createProvider(params)` - Create notification provider
- `updateProvider(providerId, params)` - Update provider

### Delivery Tracking

- `recordDeliveryEvent(params)` - Record delivery event
- `getNotificationHistory(params)` - Get notification history

## Best Practices

### 1. Use Templates for Consistency

```typescript
// Bad: Hardcoded content
await notificationsEngine.sendEmail({
  to: user.email,
  subject: 'Welcome!',
  body: 'Welcome to our app...',
});

// Good: Template-based
await notificationsEngine.sendEmail({
  to: user.email,
  templateId: 'welcome_email',
  templateData: {
    userName: user.name,
    appName: 'MyApp',
  },
});
```

### 2. Configure Retry Logic

```typescript
// Configure per-notification retry
await notificationsEngine.sendWebhook({
  url: 'https://critical-webhook.com/endpoint',
  body: { event: 'payment.succeeded' },
  retryCount: 5, // Override default
});
```

### 3. Monitor Delivery Events

```typescript
// Track delivery rates
eventBus.on('notifications.email.sent', async (event) => {
  await metrics.increment('email.sent');
});

eventBus.on('notifications.delivered', async (event) => {
  await metrics.increment('email.delivered');
});

// Calculate delivery rate
const deliveryRate = delivered / sent;
```

### 4. Use Batch Operations Efficiently

```typescript
// Bad: Send one at a time
for (const user of users) {
  await notificationsEngine.sendEmail({
    to: user.email,
    subject: 'Update',
    body: 'Newsletter',
  });
}

// Good: Use batch send
await notificationsEngine.sendBatch({
  channel: 'email',
  recipients: users.map(user => ({
    recipientAddress: user.email,
    templateData: { userName: user.name },
  })),
  templateId: 'newsletter',
});
```

## Examples

### Password Reset Flow

```typescript
// Create template
await notificationsEngine.createTemplate({
  key: 'password_reset',
  name: 'Password Reset',
  channel: 'email',
  subject: 'Reset Your Password',
  body: `
    Hi {{userName}},

    You requested a password reset. Click the link below:

    {{resetLink}}

    This link expires in {{expiryMinutes}} minutes.

    If you didn't request this, please ignore this email.
  `,
});

// Send password reset email
await notificationsEngine.sendEmail({
  to: user.email,
  templateId: 'password_reset',
  templateData: {
    userName: user.name,
    resetLink: `https://myapp.com/reset/${resetToken}`,
    expiryMinutes: 30,
  },
});
```

### Two-Factor Authentication

```typescript
// SMS verification code
const code = Math.floor(100000 + Math.random() * 900000).toString();

await notificationsEngine.sendSMS({
  to: user.phoneNumber,
  body: `Your verification code is ${code}. Do not share this code.`,
});

// Also send via email as backup
await notificationsEngine.sendEmail({
  to: user.email,
  subject: 'Verification Code',
  body: `Your verification code is ${code}`,
});
```

### Order Status Updates

```typescript
// Create order status webhook
await notificationsEngine.sendWebhook({
  url: user.webhookUrl,
  method: 'POST',
  body: {
    event: 'order.status_changed',
    orderId: order.id,
    status: 'shipped',
    trackingNumber: order.trackingNumber,
    timestamp: new Date().toISOString(),
  },
});

// Also send push notification
await notificationsEngine.sendPush({
  to: user.deviceToken,
  title: 'Order Shipped',
  body: `Your order #${order.id} has been shipped`,
  data: {
    orderId: order.id,
    trackingUrl: order.trackingUrl,
  },
});
```

## Database Schema

See `packages/engines/notifications-engine/supabase/README.md` for database schema documentation.

## License

MIT
