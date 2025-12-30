import { SilentEngine, MockProvider, RoutingPolicy } from '@qbos/silent-engine-core';

const mockProvider = new MockProvider();
mockProvider.configure({ providerKey: 'mock', apiKey: 'local' });

const costOptimizedPolicy: RoutingPolicy = {
  policyKey: 'cost_optimized',
  displayName: 'Cost Optimized',
  description: 'Prefer low cost models for everyday use.',
  maxCostPerRequest: 0.001,
  maxLatencyMs: 5000,
  preferredCapabilities: ['low_cost', 'fast_latency'],
  requiredCapabilities: [],
  allowFallback: true,
  requireSafetyCheck: false,
  minSafetyLevel: 'low',
};

const qualityFirstPolicy: RoutingPolicy = {
  policyKey: 'quality_first',
  displayName: 'Quality First',
  description: 'Prefer strong reasoning models for complex work.',
  preferredCapabilities: ['strong_reasoning', 'long_context'],
  requiredCapabilities: [],
  allowFallback: true,
  requireSafetyCheck: false,
  minSafetyLevel: 'low',
};

const speedPriorityPolicy: RoutingPolicy = {
  policyKey: 'speed_priority',
  displayName: 'Speed Priority',
  description: 'Prefer fast latency responses.',
  maxCostPerRequest: 0.005,
  maxLatencyMs: 1000,
  preferredCapabilities: ['fast_latency'],
  requiredCapabilities: [],
  allowFallback: true,
  requireSafetyCheck: false,
  minSafetyLevel: 'low',
};

export const silentEngine = new SilentEngine({
  providers: [mockProvider],
  policies: [costOptimizedPolicy, qualityFirstPolicy, speedPriorityPolicy],
  defaultPolicyKey: 'cost_optimized',
});
