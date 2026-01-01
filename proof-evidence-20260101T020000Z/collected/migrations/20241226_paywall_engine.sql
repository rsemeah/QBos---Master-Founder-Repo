-- Paywall Engine™ Migration
-- Pricing Plans, Subscriptions, Entitlements, and Usage Tracking

-- Pricing Plans Table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly', 'lifetime')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for plan lookups
CREATE INDEX idx_pricing_plans_tier ON pricing_plans(tier);
CREATE INDEX idx_pricing_plans_is_active ON pricing_plans(is_active);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES pricing_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Only one active subscription per user/org
  UNIQUE(user_id, org_id)
);

-- Index for subscription lookups
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Entitlements Table (feature access tracking)
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR org_id IS NOT NULL),
  UNIQUE(user_id, org_id, feature)
);

-- Index for entitlement lookups
CREATE INDEX idx_entitlements_user ON entitlements(user_id);
CREATE INDEX idx_entitlements_org ON entitlements(org_id);
CREATE INDEX idx_entitlements_feature ON entitlements(feature);
CREATE INDEX idx_entitlements_subscription ON entitlements(subscription_id);

-- Usage Records Table
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL, -- e.g., 'ai_requests', 'builds', 'storage_gb'
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR org_id IS NOT NULL)
);

-- Index for usage lookups
CREATE INDEX idx_usage_records_user ON usage_records(user_id);
CREATE INDEX idx_usage_records_org ON usage_records(org_id);
CREATE INDEX idx_usage_records_resource_type ON usage_records(resource_type);
CREATE INDEX idx_usage_records_recorded_at ON usage_records(recorded_at);
CREATE INDEX idx_usage_records_subscription ON usage_records(subscription_id);

-- Row Level Security Policies

-- Pricing Plans RLS (read-only for all)
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing plans"
  ON pricing_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage pricing plans"
  ON pricing_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = subscriptions.org_id
        AND org_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Entitlements RLS
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlements"
  ON entitlements FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = entitlements.org_id
        AND org_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage entitlements"
  ON entitlements FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usage Records RLS
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage records"
  ON usage_records FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = usage_records.org_id
        AND org_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage usage records"
  ON usage_records FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper Functions

-- Function to check if user has access to feature
CREATE OR REPLACE FUNCTION check_entitlement(
  p_user_id UUID,
  p_feature TEXT,
  p_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_entitlement BOOLEAN := FALSE;
  v_subscription subscriptions%ROWTYPE;
  v_plan pricing_plans%ROWTYPE;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE (user_id = p_user_id OR org_id = p_org_id)
    AND status = 'active'
  ORDER BY org_id NULLS LAST
  LIMIT 1;

  -- No active subscription, check free plan
  IF NOT FOUND THEN
    SELECT * INTO v_plan
    FROM pricing_plans
    WHERE id = 'free' AND is_active = true;

    IF FOUND AND v_plan.features ? p_feature THEN
      RETURN TRUE;
    END IF;

    RETURN FALSE;
  END IF;

  -- Get plan and check features
  SELECT * INTO v_plan
  FROM pricing_plans
  WHERE id = v_subscription.plan_id;

  IF FOUND AND v_plan.features ? p_feature THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_resource_type TEXT,
  p_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage DECIMAL,
  limit_value DECIMAL,
  plan_id TEXT
) AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_plan pricing_plans%ROWTYPE;
  v_usage DECIMAL;
  v_limit DECIMAL;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE (user_id = p_user_id OR org_id = p_org_id)
    AND status = 'active'
  ORDER BY org_id NULLS LAST
  LIMIT 1;

  -- No active subscription, use free plan
  IF NOT FOUND THEN
    SELECT * INTO v_plan
    FROM pricing_plans
    WHERE id = 'free' AND is_active = true;
  ELSE
    SELECT * INTO v_plan
    FROM pricing_plans
    WHERE id = v_subscription.plan_id;
  END IF;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0::DECIMAL, NULL::TEXT;
    RETURN;
  END IF;

  -- Calculate current usage
  SELECT COALESCE(SUM(quantity), 0) INTO v_usage
  FROM usage_records
  WHERE (user_id = p_user_id OR org_id = p_org_id)
    AND resource_type = p_resource_type
    AND recorded_at >= COALESCE(v_subscription.current_period_start, NOW() - INTERVAL '30 days');

  -- Get limit from plan
  v_limit := (v_plan.limits->p_resource_type)::DECIMAL;

  -- No limit defined means unlimited
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT TRUE, v_usage, NULL::DECIMAL, v_plan.id;
    RETURN;
  END IF;

  -- Check if under limit
  RETURN QUERY SELECT (v_usage < v_limit), v_usage, v_limit, v_plan.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record usage
CREATE OR REPLACE FUNCTION record_usage(
  p_user_id UUID,
  p_resource_type TEXT,
  p_quantity DECIMAL DEFAULT 1,
  p_org_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Get active subscription ID
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE (user_id = p_user_id OR org_id = p_org_id)
    AND status = 'active'
  ORDER BY org_id NULLS LAST
  LIMIT 1;

  -- Insert usage record
  INSERT INTO usage_records (
    user_id,
    org_id,
    subscription_id,
    resource_type,
    quantity,
    metadata
  ) VALUES (
    p_user_id,
    p_org_id,
    v_subscription_id,
    p_resource_type,
    p_quantity,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_record_id;

  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default pricing plans
INSERT INTO pricing_plans (id, tier, name, description, price, currency, interval, features, limits, trial_days) VALUES
  ('free', 'free', 'Free', 'Perfect for trying out QuietBuild OS', 0, 'USD', 'monthly',
   '["basic_auth", "ai_router"]'::jsonb,
   '{"maxUsers": 5, "maxProjects": 1, "maxAIRequests": 100, "maxStorageGB": 1}'::jsonb,
   0),
  ('pro', 'pro', 'Professional', 'For serious builders', 49, 'USD', 'monthly',
   '["basic_auth", "ai_router", "analytics", "priority_support"]'::jsonb,
   '{"maxUsers": 50, "maxProjects": 10, "maxAIRequests": 10000, "maxStorageGB": 100, "customDomain": true, "prioritySupport": true}'::jsonb,
   14),
  ('enterprise', 'enterprise', 'Enterprise', 'Custom solutions for teams', 299, 'USD', 'monthly',
   '["basic_auth", "ai_router", "analytics", "priority_support", "sso", "custom_templates", "dedicated_support"]'::jsonb,
   '{"maxUsers": -1, "maxProjects": -1, "maxAIRequests": -1, "maxStorageGB": -1, "customDomain": true, "prioritySupport": true, "sso": true}'::jsonb,
   30)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON pricing_plans TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON entitlements TO authenticated;
GRANT SELECT ON usage_records TO authenticated;
GRANT ALL ON pricing_plans TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON entitlements TO service_role;
GRANT ALL ON usage_records TO service_role;
-- ================================================================
-- PaywallEngine tables
-- ================================================================

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  source TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT entitlement_key_nonempty CHECK (length(entitlement_key) > 0)
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id);
CREATE INDEX idx_entitlements_key ON entitlements(entitlement_key);

CREATE TRIGGER set_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT usage_entitlement_key_nonempty CHECK (length(entitlement_key) > 0)
);

CREATE INDEX idx_usage_records_user ON usage_records(user_id);
CREATE INDEX idx_usage_records_key ON usage_records(entitlement_key);

CREATE TRIGGER set_usage_records_updated_at
  BEFORE UPDATE ON usage_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlements_select_own
  ON entitlements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY entitlements_insert_own
  ON entitlements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY entitlements_update_own
  ON entitlements FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY usage_records_select_own
  ON usage_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY usage_records_insert_own
  ON usage_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY usage_records_update_own
  ON usage_records FOR UPDATE
  USING (user_id = auth.uid());
