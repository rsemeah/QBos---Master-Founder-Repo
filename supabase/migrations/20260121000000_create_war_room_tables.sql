-- War Room Tables
-- Migration: 20260121000000_create_war_room_tables

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-secret-jwt-token-with-at-least-32-characters-long';

-- War Room Events Table
-- Stores all ingested operational events
CREATE TABLE IF NOT EXISTS war_room_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('truthserum', 'execution', 'silent', 'sight', 'robby', 'ci')),
  severity TEXT NOT NULL CHECK (severity IN ('green', 'yellow', 'red', 'critical')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message TEXT NOT NULL,
  related_receipts TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for war_room_events
CREATE INDEX IF NOT EXISTS idx_war_room_events_timestamp ON war_room_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_events_source ON war_room_events(source);
CREATE INDEX IF NOT EXISTS idx_war_room_events_severity ON war_room_events(severity);
CREATE INDEX IF NOT EXISTS idx_war_room_events_related_receipts ON war_room_events USING gin(related_receipts);

-- War Room Health Snapshots Table
-- Stores periodic health check results
CREATE TABLE IF NOT EXISTS war_room_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('green', 'yellow', 'red', 'critical')),
  constitutional_status TEXT NOT NULL CHECK (constitutional_status IN ('green', 'yellow', 'red', 'critical')),
  constitutional_receipts_per_hour DECIMAL(10,2) DEFAULT 0,
  constitutional_unverified_attempts INTEGER DEFAULT 0,
  constitutional_drift_score DECIMAL(10,3) DEFAULT 0,
  engines JSONB NOT NULL DEFAULT '[]',
  robby_status TEXT NOT NULL CHECK (robby_status IN ('green', 'yellow', 'red', 'critical')),
  robby_autonomy_level INTEGER NOT NULL CHECK (robby_autonomy_level BETWEEN 0 AND 4),
  robby_blocked_actions_24h INTEGER DEFAULT 0,
  robby_human_interrupts_24h INTEGER DEFAULT 0,
  robby_confidence_delta DECIMAL(10,3) DEFAULT 0,
  robby_in_scope BOOLEAN DEFAULT true,
  cost_status TEXT NOT NULL CHECK (cost_status IN ('green', 'yellow', 'red', 'critical')),
  cost_current_spend_rate DECIMAL(10,2) DEFAULT 0,
  cost_projected_monthly DECIMAL(10,2) DEFAULT 0,
  cost_budget_remaining DECIMAL(10,2) DEFAULT 0,
  cost_kill_threshold DECIMAL(10,2) DEFAULT 0,
  cost_at_risk BOOLEAN DEFAULT false,
  receipt_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for war_room_health_snapshots
CREATE INDEX IF NOT EXISTS idx_war_room_health_snapshots_timestamp ON war_room_health_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_health_snapshots_overall_status ON war_room_health_snapshots(overall_status);

-- War Room Regression Results Table
-- Stores regression test results
CREATE TABLE IF NOT EXISTS war_room_regression_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  profile TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  diffs JSONB DEFAULT '[]',
  golden_bundle_id TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for war_room_regression_results
CREATE INDEX IF NOT EXISTS idx_war_room_regression_results_timestamp ON war_room_regression_results(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_regression_results_profile ON war_room_regression_results(profile);
CREATE INDEX IF NOT EXISTS idx_war_room_regression_results_passed ON war_room_regression_results(passed);

-- War Room Freeze Log Table
-- Stores freeze/unfreeze audit trail
CREATE TABLE IF NOT EXISTS war_room_freeze_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('freeze', 'unfreeze', 'emergency_stop')),
  reason TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  receipt_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for war_room_freeze_log
CREATE INDEX IF NOT EXISTS idx_war_room_freeze_log_timestamp ON war_room_freeze_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_freeze_log_action ON war_room_freeze_log(action);

-- War Room Cost Caps Table
-- Stores cost cap configurations
CREATE TABLE IF NOT EXISTS war_room_cost_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_budget DECIMAL(10,2) NOT NULL,
  kill_threshold DECIMAL(10,2) NOT NULL,
  warning_threshold DECIMAL(10,2) NOT NULL,
  set_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  set_by TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for war_room_cost_caps
CREATE INDEX IF NOT EXISTS idx_war_room_cost_caps_active ON war_room_cost_caps(active);
CREATE INDEX IF NOT EXISTS idx_war_room_cost_caps_set_at ON war_room_cost_caps(set_at DESC);

-- War Room Routing Overrides Table
-- Stores routing override configurations
CREATE TABLE IF NOT EXISTS war_room_routing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  force_model TEXT,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  set_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  set_by TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for war_room_routing_overrides
CREATE INDEX IF NOT EXISTS idx_war_room_routing_overrides_enabled ON war_room_routing_overrides(enabled);
CREATE INDEX IF NOT EXISTS idx_war_room_routing_overrides_expires_at ON war_room_routing_overrides(expires_at);

-- War Room Robby Autonomy Log Table
-- Stores Robby autonomy level changes
CREATE TABLE IF NOT EXISTS war_room_robby_autonomy_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('downgrade', 'upgrade', 'kill')),
  from_level INTEGER CHECK (from_level BETWEEN 0 AND 4),
  to_level INTEGER CHECK (to_level BETWEEN 0 AND 4),
  reason TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  receipt_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for war_room_robby_autonomy_log
CREATE INDEX IF NOT EXISTS idx_war_room_robby_autonomy_log_timestamp ON war_room_robby_autonomy_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_robby_autonomy_log_action ON war_room_robby_autonomy_log(action);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE war_room_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_regression_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_freeze_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_cost_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_routing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_robby_autonomy_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (operator-only access)
-- For now, allow all authenticated users (refine in production with role-based access)

CREATE POLICY "War Room events are viewable by authenticated users"
  ON war_room_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "War Room events are insertable by authenticated users"
  ON war_room_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "War Room health snapshots are viewable by authenticated users"
  ON war_room_health_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "War Room health snapshots are insertable by authenticated users"
  ON war_room_health_snapshots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "War Room regression results are viewable by authenticated users"
  ON war_room_regression_results FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "War Room regression results are insertable by authenticated users"
  ON war_room_regression_results FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "War Room freeze log is viewable by authenticated users"
  ON war_room_freeze_log FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "War Room freeze log is insertable by authenticated users"
  ON war_room_freeze_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "War Room cost caps are viewable by authenticated users"
  ON war_room_cost_caps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "War Room cost caps are insertable by authenticated users"
  ON war_room_cost_caps FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "War Room routing overrides are viewable by authenticated users"
  ON war_room_routing_overrides FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "War Room routing overrides are insertable by authenticated users"
  ON war_room_routing_overrides FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "War Room Robby autonomy log is viewable by authenticated users"
  ON war_room_robby_autonomy_log FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "War Room Robby autonomy log is insertable by authenticated users"
  ON war_room_robby_autonomy_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE war_room_events IS 'Operational events ingested from all QBos systems';
COMMENT ON TABLE war_room_health_snapshots IS 'Periodic system health check results';
COMMENT ON TABLE war_room_regression_results IS 'Regression test execution results';
COMMENT ON TABLE war_room_freeze_log IS 'Audit trail of system freeze/unfreeze operations';
COMMENT ON TABLE war_room_cost_caps IS 'Cost budget and threshold configurations';
COMMENT ON TABLE war_room_routing_overrides IS 'Model routing override configurations';
COMMENT ON TABLE war_room_robby_autonomy_log IS 'Robby PA autonomy level change history';
