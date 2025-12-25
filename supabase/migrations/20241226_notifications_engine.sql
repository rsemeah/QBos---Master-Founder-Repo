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
