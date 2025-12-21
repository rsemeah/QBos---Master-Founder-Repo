# NotificationsEngine™ - Database Schema

**Database schema for NotificationsEngine.**

## Tables

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  recipient_id UUID,
  recipient_address TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  template_id UUID,
  template_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  provider_id UUID,
  provider_message_id TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notifications_channel
    CHECK (channel IN ('email', 'sms', 'push', 'webhook')),
  CONSTRAINT chk_notifications_status
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'cancelled')),
  CONSTRAINT chk_notifications_priority
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### notification_templates

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notification_templates_channel
    CHECK (channel IN ('email', 'sms', 'push', 'webhook'))
);

CREATE INDEX idx_notification_templates_key ON notification_templates(key);
CREATE INDEX idx_notification_templates_channel ON notification_templates(channel);
CREATE INDEX idx_notification_templates_is_active ON notification_templates(is_active);
```

### notification_providers

```sql
CREATE TABLE notification_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notification_providers_channel
    CHECK (channel IN ('email', 'sms', 'push', 'webhook')),
  CONSTRAINT chk_notification_providers_type
    CHECK (type IN ('sendgrid', 'ses', 'mailgun', 'twilio', 'vonage', 'fcm', 'apns', 'custom'))
);

CREATE INDEX idx_notification_providers_channel ON notification_providers(channel);
CREATE INDEX idx_notification_providers_is_active ON notification_providers(is_active);
CREATE INDEX idx_notification_providers_is_default ON notification_providers(is_default);
```

### notification_delivery_events

```sql
CREATE TABLE notification_delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  provider_event_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notification_delivery_events_type
    CHECK (event_type IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'spam', 'unsubscribed'))
);

CREATE INDEX idx_notification_delivery_events_notification_id ON notification_delivery_events(notification_id);
CREATE INDEX idx_notification_delivery_events_event_type ON notification_delivery_events(event_type);
CREATE INDEX idx_notification_delivery_events_timestamp ON notification_delivery_events(timestamp);
```

## RLS Policies

```sql
-- Notifications: users can view their own notifications, admins can manage all
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );

CREATE POLICY "notifications_insert_admin"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name IN ('admin', 'service')
    )
  );

CREATE POLICY "notifications_update_admin"
  ON notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name IN ('admin', 'service')
    )
  );

-- Templates: admins can manage, everyone can read active templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_templates_select_active"
  ON notification_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "notification_templates_admin"
  ON notification_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );

-- Providers: admin only
ALTER TABLE notification_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_providers_admin"
  ON notification_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );

-- Delivery events: users can view events for their notifications, admins can manage all
ALTER TABLE notification_delivery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_delivery_events_select_own"
  ON notification_delivery_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notifications
      WHERE notifications.id = notification_delivery_events.notification_id
        AND (notifications.recipient_id = auth.uid() OR
             EXISTS (
               SELECT 1 FROM identity_user_roles
               WHERE user_id = auth.uid() AND role_name = 'admin'
             ))
    )
  );

CREATE POLICY "notification_delivery_events_insert_service"
  ON notification_delivery_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name IN ('admin', 'service')
    )
  );
```

## Functions

### Update notification timestamp

```sql
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER trg_notification_providers_updated_at
  BEFORE UPDATE ON notification_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();
```

## Migration

See `packages/database/supabase/migrations/20251221120004_notifications_engine_foundation.sql`
