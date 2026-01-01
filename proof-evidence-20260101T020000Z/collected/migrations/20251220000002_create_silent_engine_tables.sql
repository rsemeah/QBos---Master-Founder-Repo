-- SilentEngine™ Database Schema
-- AI routing, provider metrics, and audit logging

-- AI Providers Table
-- Tracks available AI providers and their configurations
CREATE TABLE silent_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('anthropic', 'openai', 'google', 'custom')),
  
  -- Configuration
  api_endpoint TEXT,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  
  -- Rate Limits
  max_requests_per_minute INTEGER,
  max_tokens_per_minute INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_silent_providers_enabled ON silent_providers(is_enabled);
CREATE INDEX idx_silent_providers_priority ON silent_providers(priority DESC);

-- AI Models Table
-- Tracks available models and their capabilities
CREATE TABLE silent_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES silent_providers(id) ON DELETE CASCADE,
  model_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  
  -- Capabilities (JSON array of capability strings)
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Cost (per 1M tokens)
  cost_per_million_input_tokens NUMERIC(10, 2),
  cost_per_million_output_tokens NUMERIC(10, 2),
  
  -- Performance
  max_context_tokens INTEGER,
  max_output_tokens INTEGER,
  average_latency_ms INTEGER,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'down')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT silent_models_provider_model_unique UNIQUE (provider_id, model_key)
);

CREATE INDEX idx_silent_models_provider_id ON silent_models(provider_id);
CREATE INDEX idx_silent_models_available ON silent_models(is_available);
CREATE INDEX idx_silent_models_health ON silent_models(health_status);
CREATE INDEX idx_silent_models_capabilities ON silent_models USING GIN (capabilities);

-- Routing Policies Table
-- Defines routing policies for different use cases
CREATE TABLE silent_routing_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key TEXT NOT NULL UNIQUE,
  policy_name TEXT NOT NULL,
  organization_id UUID,
  
  -- Policy Configuration
  max_cost NUMERIC(10, 6),
  max_latency INTEGER,
  required_capabilities JSONB DEFAULT '[]'::jsonb,
  preferred_capabilities JSONB DEFAULT '[]'::jsonb,
  excluded_providers JSONB DEFAULT '[]'::jsonb,
  
  -- Fallback Configuration
  enable_fallback BOOLEAN DEFAULT true,
  max_fallback_attempts INTEGER DEFAULT 3,
  
  -- Safety Configuration
  enable_pii_detection BOOLEAN DEFAULT true,
  enable_safety_classifier BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_silent_policies_org_id ON silent_routing_policies(organization_id);
CREATE INDEX idx_silent_policies_key ON silent_routing_policies(policy_key);

-- Routing Decisions Table
-- Audit log of all routing decisions
CREATE TABLE silent_routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  project_id UUID,
  organization_id UUID,
  
  -- Request Details
  policy_key TEXT NOT NULL,
  requested_capabilities JSONB,
  max_cost NUMERIC(10, 6),
  max_latency INTEGER,
  
  -- Routing Result
  selected_provider TEXT NOT NULL,
  selected_model TEXT NOT NULL,
  selection_reason TEXT,
  fallback_used BOOLEAN DEFAULT false,
  fallback_count INTEGER DEFAULT 0,
  
  -- Constraints Evaluation
  constraints_met BOOLEAN NOT NULL,
  constraint_violations JSONB,
  
  -- Timing
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_silent_routing_request_id ON silent_routing_decisions(request_id);
CREATE INDEX idx_silent_routing_project_id ON silent_routing_decisions(project_id);
CREATE INDEX idx_silent_routing_org_id ON silent_routing_decisions(organization_id);
CREATE INDEX idx_silent_routing_provider ON silent_routing_decisions(selected_provider);
CREATE INDEX idx_silent_routing_decided_at ON silent_routing_decisions(decided_at DESC);

-- Generation Audit Logs Table
-- Complete audit trail of all AI generations
CREATE TABLE silent_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL REFERENCES silent_routing_decisions(request_id),
  
  -- Request Information
  messages JSONB NOT NULL,
  system_prompt TEXT,
  temperature NUMERIC(3, 2),
  max_tokens INTEGER,
  
  -- Provider & Model
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  
  -- Response Information
  response_text TEXT,
  response_tokens_input INTEGER,
  response_tokens_output INTEGER,
  finish_reason TEXT,
  
  -- Cost & Latency
  actual_cost NUMERIC(10, 6),
  actual_latency_ms INTEGER,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  error_message TEXT,
  
  -- Safety Checks
  pii_detected BOOLEAN DEFAULT false,
  safety_issues JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  ip_address INET
);

CREATE INDEX idx_silent_audit_request_id ON silent_audit_logs(request_id);
CREATE INDEX idx_silent_audit_provider ON silent_audit_logs(provider);
CREATE INDEX idx_silent_audit_model ON silent_audit_logs(model);
CREATE INDEX idx_silent_audit_status ON silent_audit_logs(status);
CREATE INDEX idx_silent_audit_created_at ON silent_audit_logs(created_at DESC);
CREATE INDEX idx_silent_audit_user_id ON silent_audit_logs(user_id);

-- Provider Metrics Table
-- Aggregated metrics for provider performance
CREATE TABLE silent_provider_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES silent_providers(id) ON DELETE CASCADE,
  model_key TEXT NOT NULL,
  
  -- Time Window
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Request Metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  timeout_requests INTEGER NOT NULL DEFAULT 0,
  rate_limited_requests INTEGER NOT NULL DEFAULT 0,
  
  -- Performance Metrics
  avg_latency_ms INTEGER,
  p50_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  p99_latency_ms INTEGER,
  
  -- Cost Metrics
  total_cost NUMERIC(10, 6),
  total_input_tokens BIGINT,
  total_output_tokens BIGINT,
  
  -- Metadata
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT silent_metrics_provider_window_unique UNIQUE (provider_id, model_key, window_start)
);

CREATE INDEX idx_silent_metrics_provider_id ON silent_provider_metrics(provider_id);
CREATE INDEX idx_silent_metrics_window ON silent_provider_metrics(window_start DESC);

-- Circuit Breaker State Table
-- Tracks circuit breaker state for each provider
CREATE TABLE silent_circuit_breaker_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key TEXT NOT NULL UNIQUE,
  
  -- Circuit State
  state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half_open')) DEFAULT 'closed',
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  
  -- Configuration
  failure_threshold INTEGER NOT NULL DEFAULT 5,
  timeout_duration_ms INTEGER NOT NULL DEFAULT 60000,
  
  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_silent_breaker_state ON silent_circuit_breaker_state(state);
CREATE INDEX idx_silent_breaker_provider ON silent_circuit_breaker_state(provider_key);

-- Safety Classifier Logs
-- Tracks safety classification results
CREATE TABLE silent_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  
  -- Safety Classification
  is_safe BOOLEAN NOT NULL,
  safety_score NUMERIC(3, 2),
  
  -- Issues Detected
  pii_detected BOOLEAN DEFAULT false,
  pii_types JSONB,
  jailbreak_attempt BOOLEAN DEFAULT false,
  prompt_injection BOOLEAN DEFAULT false,
  
  -- Action Taken
  action TEXT NOT NULL CHECK (action IN ('allowed', 'blocked', 'sanitized')),
  sanitized_content TEXT,
  
  -- Metadata
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_silent_safety_request_id ON silent_safety_logs(request_id);
CREATE INDEX idx_silent_safety_is_safe ON silent_safety_logs(is_safe);
CREATE INDEX idx_silent_safety_checked_at ON silent_safety_logs(checked_at DESC);

-- Update timestamp triggers
CREATE TRIGGER update_silent_providers_updated_at
  BEFORE UPDATE ON silent_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_silent_models_updated_at
  BEFORE UPDATE ON silent_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_silent_policies_updated_at
  BEFORE UPDATE ON silent_routing_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_silent_breaker_updated_at
  BEFORE UPDATE ON silent_circuit_breaker_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE silent_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE silent_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE silent_routing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE silent_routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE silent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE silent_provider_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE silent_circuit_breaker_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE silent_safety_logs ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY "Users can view their organization's routing policies"
  ON silent_routing_policies FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their organization's audit logs"
  ON silent_audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM silent_routing_decisions srd
    JOIN projects p ON srd.project_id = p.id
    WHERE srd.request_id = silent_audit_logs.request_id
    AND p.organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comments
COMMENT ON TABLE silent_providers IS 'SilentEngine™: AI provider registry and configuration';
COMMENT ON TABLE silent_models IS 'SilentEngine™: Available models with capabilities and cost';
COMMENT ON TABLE silent_routing_policies IS 'SilentEngine™: Routing policies for intelligent model selection';
COMMENT ON TABLE silent_routing_decisions IS 'SilentEngine™: Audit trail of routing decisions';
COMMENT ON TABLE silent_audit_logs IS 'SilentEngine™: Complete audit log of AI generations';
COMMENT ON TABLE silent_provider_metrics IS 'SilentEngine™: Aggregated provider performance metrics';
COMMENT ON TABLE silent_circuit_breaker_state IS 'SilentEngine™: Circuit breaker state for failover';
COMMENT ON TABLE silent_safety_logs IS 'SilentEngine™: Safety classification and PII detection logs';
