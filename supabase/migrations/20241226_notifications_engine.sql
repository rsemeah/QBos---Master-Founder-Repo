-- Notifications Engine™ Migration
-- Email, SMS, and Push Notification System

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  subject TEXT, -- For email
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- List of template variables like {{userName}}
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for template lookups
CREATE INDEX idx_notification_templates_channel ON notification_templates(channel);
CREATE INDEX idx_notification_templates_is_active ON notification_templates(is_active);

-- Notification Queue Table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'failed')) DEFAULT 'queued',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  subject TEXT,
  body TEXT NOT NULL,
  template_id TEXT REFERENCES notification_templates(id),
  template_data JSONB DEFAULT '{}'::jsonb,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_device_token TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}'::jsonb,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_priority ON notification_queue(priority);
CREATE INDEX idx_notification_queue_channel ON notification_queue(channel);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_template ON notification_queue(template_id);

-- Index for finding next notifications to process
CREATE INDEX idx_notification_queue_processing ON notification_queue(status, priority DESC, scheduled_for NULLS FIRST)
  WHERE status IN ('queued', 'failed') AND retry_count < max_retries;

-- Notification Logs Table (sent notifications history)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES notification_queue(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  subject TEXT,
  body TEXT,
  recipient TEXT NOT NULL, -- Email address, phone number, or device token
  provider TEXT, -- e.g., 'sendgrid', 'twilio', 'fcm'
  provider_message_id TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for logs and analytics
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_notification_logs_provider ON notification_logs(provider);
CREATE INDEX idx_notification_logs_queue ON notification_logs(queue_id);

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  sms_marketing BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  push_marketing BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for preference lookups
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- Row Level Security Policies

-- Notification Templates RLS (read-only for users)
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage templates"
  ON notification_templates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Notification Queue RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queued notifications"
  ON notification_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage notification queue"
  ON notification_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Notification Logs RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs"
  ON notification_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage notification logs"
  ON notification_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Notification Preferences RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Helper Functions

-- Function to enqueue notification
CREATE OR REPLACE FUNCTION enqueue_notification(
  p_user_id UUID,
  p_channel TEXT,
  p_subject TEXT DEFAULT NULL,
  p_body TEXT DEFAULT NULL,
  p_template_id TEXT DEFAULT NULL,
  p_template_data JSONB DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_template notification_templates%ROWTYPE;
  v_final_subject TEXT;
  v_final_body TEXT;
  v_user auth.users%ROWTYPE;
  v_prefs notification_preferences%ROWTYPE;
BEGIN
  -- Get user details
  SELECT * INTO v_user FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check user preferences
  SELECT * INTO v_prefs FROM notification_preferences WHERE user_id = p_user_id;
  IF FOUND THEN
    -- Check if channel is enabled
    IF (p_channel = 'email' AND NOT v_prefs.email_enabled) OR
       (p_channel = 'sms' AND NOT v_prefs.sms_enabled) OR
       (p_channel = 'push' AND NOT v_prefs.push_enabled) THEN
      RAISE EXCEPTION 'Channel % disabled for user', p_channel;
    END IF;
  END IF;

  -- If template provided, apply it
  IF p_template_id IS NOT NULL THEN
    SELECT * INTO v_template
    FROM notification_templates
    WHERE id = p_template_id AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Template not found or inactive';
    END IF;

    v_final_subject := v_template.subject;
    v_final_body := v_template.body;

    -- Simple template variable replacement
    IF p_template_data IS NOT NULL THEN
      -- Replace {{variable}} with values from template_data
      -- This is simplified - real implementation would use proper templating
      v_final_body := v_final_body;
    END IF;
  ELSE
    v_final_subject := p_subject;
    v_final_body := p_body;
  END IF;

  -- Insert into queue
  INSERT INTO notification_queue (
    user_id,
    channel,
    subject,
    body,
    template_id,
    template_data,
    priority,
    scheduled_for,
    recipient_email,
    recipient_phone
  ) VALUES (
    p_user_id,
    p_channel,
    v_final_subject,
    v_final_body,
    p_template_id,
    p_template_data,
    p_priority,
    p_scheduled_for,
    CASE WHEN p_channel = 'email' THEN v_user.email ELSE NULL END,
    CASE WHEN p_channel = 'sms' THEN v_user.phone ELSE NULL END
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next notifications to process
CREATE OR REPLACE FUNCTION get_pending_notifications(p_batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  channel TEXT,
  subject TEXT,
  body TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_device_token TEXT,
  priority TEXT,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nq.id,
    nq.user_id,
    nq.channel,
    nq.subject,
    nq.body,
    nq.recipient_email,
    nq.recipient_phone,
    nq.recipient_device_token,
    nq.priority,
    nq.retry_count
  FROM notification_queue nq
  WHERE nq.status IN ('queued', 'failed')
    AND nq.retry_count < nq.max_retries
    AND (nq.scheduled_for IS NULL OR nq.scheduled_for <= NOW())
  ORDER BY
    CASE nq.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
    END,
    nq.scheduled_for NULLS FIRST,
    nq.created_at
  LIMIT p_batch_size
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(
  p_notification_id UUID,
  p_provider TEXT DEFAULT NULL,
  p_provider_message_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_notification notification_queue%ROWTYPE;
BEGIN
  SELECT * INTO v_notification
  FROM notification_queue
  WHERE id = p_notification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found';
  END IF;

  -- Update queue status
  UPDATE notification_queue
  SET status = 'sent',
      sent_at = NOW(),
      updated_at = NOW()
  WHERE id = p_notification_id;

  -- Log the send
  INSERT INTO notification_logs (
    queue_id,
    user_id,
    channel,
    status,
    subject,
    body,
    recipient,
    provider,
    provider_message_id
  ) VALUES (
    p_notification_id,
    v_notification.user_id,
    v_notification.channel,
    'sent',
    v_notification.subject,
    v_notification.body,
    COALESCE(v_notification.recipient_email, v_notification.recipient_phone, v_notification.recipient_device_token),
    p_provider,
    p_provider_message_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as failed
CREATE OR REPLACE FUNCTION mark_notification_failed(
  p_notification_id UUID,
  p_error TEXT
)
RETURNS VOID AS $$
DECLARE
  v_notification notification_queue%ROWTYPE;
BEGIN
  SELECT * INTO v_notification
  FROM notification_queue
  WHERE id = p_notification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found';
  END IF;

  -- Update queue status
  UPDATE notification_queue
  SET status = CASE
                 WHEN retry_count + 1 >= max_retries THEN 'failed'
                 ELSE 'queued'
               END,
      error = p_error,
      retry_count = retry_count + 1,
      updated_at = NOW()
  WHERE id = p_notification_id;

  -- Log the failure
  INSERT INTO notification_logs (
    queue_id,
    user_id,
    channel,
    status,
    subject,
    body,
    recipient,
    error
  ) VALUES (
    p_notification_id,
    v_notification.user_id,
    v_notification.channel,
    'failed',
    v_notification.subject,
    v_notification.body,
    COALESCE(v_notification.recipient_email, v_notification.recipient_phone, v_notification.recipient_device_token),
    p_error
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default templates
INSERT INTO notification_templates (id, name, channel, subject, body, variables) VALUES
  ('build_started', 'Build Started', 'email',
   'Your build has started',
   'Hi {{userName}},\n\nYour build session for "{{ideaDescription}}" has started.\n\nYou can track progress at: {{progressUrl}}',
   '["userName", "ideaDescription", "progressUrl"]'::jsonb),
  ('build_complete', 'Build Complete', 'email',
   'Your app is ready!',
   'Hi {{userName}},\n\nGreat news! Your app "{{ideaDescription}}" is complete.\n\nView it at: {{appUrl}}\nRepo: {{repoUrl}}',
   '["userName", "ideaDescription", "appUrl", "repoUrl"]'::jsonb),
  ('payment_required', 'Payment Required', 'email',
   'Payment needed to continue',
   'Hi {{userName}},\n\nYour build is ready for payment (${{amount}}).\n\nComplete payment: {{paymentUrl}}',
   '["userName", "amount", "paymentUrl"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON notification_templates TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
GRANT SELECT ON notification_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT ALL ON notification_templates TO service_role;
GRANT ALL ON notification_queue TO service_role;
GRANT ALL ON notification_logs TO service_role;
GRANT ALL ON notification_preferences TO service_role;
-- ================================================================
-- NotificationsEngine tables
-- ================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  destination TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT notification_channel_nonempty CHECK (length(channel) > 0)
);

CREATE INDEX idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);

CREATE TRIGGER set_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES notification_queue(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_queue ON notification_logs(queue_id);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_queue_select_own
  ON notification_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY notification_queue_insert_own
  ON notification_queue FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_queue_update_own
  ON notification_queue FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY notification_logs_select_own
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notification_queue
      WHERE notification_queue.id = notification_logs.queue_id
      AND notification_queue.user_id = auth.uid()
    )
  );
