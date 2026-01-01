-- Seed Data for SilentEngine™
-- Initial providers, models, and policies

-- Insert Default Providers
INSERT INTO silent_providers (provider_key, provider_name, provider_type, is_enabled, priority) VALUES
('anthropic', 'Anthropic', 'anthropic', true, 90),
('openai', 'OpenAI', 'openai', true, 85),
('google', 'Google AI', 'google', true, 80);

-- Insert Anthropic Models
INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'claude-3-5-sonnet-20241022',
  'Claude 3.5 Sonnet',
  '["long_context", "tool_use", "vision", "streaming", "code_generation", "strong_reasoning"]'::jsonb,
  3.00,
  15.00,
  200000,
  8192,
  2500
FROM silent_providers WHERE provider_key = 'anthropic';

INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'claude-3-opus-20240229',
  'Claude 3 Opus',
  '["long_context", "tool_use", "vision", "streaming", "strong_reasoning"]'::jsonb,
  15.00,
  75.00,
  200000,
  4096,
  3500
FROM silent_providers WHERE provider_key = 'anthropic';

INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'claude-3-haiku-20240307',
  'Claude 3 Haiku',
  '["long_context", "tool_use", "vision", "streaming", "low_cost", "fast_latency"]'::jsonb,
  0.25,
  1.25,
  200000,
  4096,
  800
FROM silent_providers WHERE provider_key = 'anthropic';

-- Insert OpenAI Models
INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'gpt-4-turbo-2024-04-09',
  'GPT-4 Turbo',
  '["long_context", "tool_use", "vision", "streaming", "code_generation"]'::jsonb,
  10.00,
  30.00,
  128000,
  4096,
  3000
FROM silent_providers WHERE provider_key = 'openai';

INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'gpt-4o',
  'GPT-4o',
  '["long_context", "tool_use", "vision", "streaming", "code_generation", "fast_latency"]'::jsonb,
  5.00,
  15.00,
  128000,
  4096,
  1800
FROM silent_providers WHERE provider_key = 'openai';

INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'gpt-3.5-turbo',
  'GPT-3.5 Turbo',
  '["tool_use", "streaming", "low_cost", "fast_latency"]'::jsonb,
  0.50,
  1.50,
  16385,
  4096,
  600
FROM silent_providers WHERE provider_key = 'openai';

-- Insert Google Models
INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'gemini-1.5-pro',
  'Gemini 1.5 Pro',
  '["long_context", "tool_use", "vision", "streaming", "code_generation"]'::jsonb,
  3.50,
  10.50,
  1000000,
  8192,
  2800
FROM silent_providers WHERE provider_key = 'google';

INSERT INTO silent_models (provider_id, model_key, model_name, capabilities, cost_per_million_input_tokens, cost_per_million_output_tokens, max_context_tokens, max_output_tokens, average_latency_ms)
SELECT 
  id,
  'gemini-1.5-flash',
  'Gemini 1.5 Flash',
  '["long_context", "tool_use", "vision", "streaming", "low_cost", "fast_latency"]'::jsonb,
  0.35,
  1.05,
  1000000,
  8192,
  900
FROM silent_providers WHERE provider_key = 'google';

-- Insert Default Routing Policies
INSERT INTO silent_routing_policies (policy_key, policy_name, max_cost, max_latency, preferred_capabilities, enable_fallback, max_fallback_attempts, enable_pii_detection, enable_safety_classifier)
VALUES
('cost_optimized', 'Cost Optimized', 0.001, 5000, '["low_cost", "fast_latency"]'::jsonb, true, 3, true, true),
('quality_first', 'Quality First', NULL, NULL, '["strong_reasoning", "long_context"]'::jsonb, true, 3, true, true),
('speed_priority', 'Speed Priority', 0.005, 1000, '["fast_latency"]'::jsonb, true, 2, false, false),
('balanced', 'Balanced', 0.010, 3000, '["tool_use", "streaming"]'::jsonb, true, 3, true, true);

-- Initialize Circuit Breaker States
INSERT INTO silent_circuit_breaker_state (provider_key, state, failure_count, failure_threshold, timeout_duration_ms)
VALUES
('anthropic', 'closed', 0, 5, 60000),
('openai', 'closed', 0, 5, 60000),
('google', 'closed', 0, 5, 60000);

-- Comments
COMMENT ON TABLE silent_providers IS 'Seeded with Anthropic, OpenAI, and Google';
COMMENT ON TABLE silent_models IS 'Seeded with Claude 3.5, GPT-4, and Gemini models';
COMMENT ON TABLE silent_routing_policies IS 'Seeded with cost_optimized, quality_first, speed_priority, balanced policies';
