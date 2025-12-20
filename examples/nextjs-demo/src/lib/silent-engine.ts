import { SilentEngine } from '@qbos/silent-engine-core';
import { AnthropicProvider } from '@qbos/silent-engine-core/dist/providers/anthropic-provider';
import { OpenAIProvider } from '@qbos/silent-engine-core/dist/providers/openai-provider';
import { GoogleProvider } from '@qbos/silent-engine-core/dist/providers/google-provider';
import { RoutingPolicy } from '@qbos/silent-engine-core/dist/types';

// Initialize providers
const providers = [
  new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  }),
  new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
  new GoogleProvider({
    apiKey: process.env.GOOGLE_API_KEY || '',
  }),
];

// Define routing policies
const costOptimizedPolicy: RoutingPolicy = {
  key: 'cost_optimized',
  name: 'Cost Optimized',
  maxCost: 0.001,
  maxLatency: 5000,
  preferredCapabilities: ['low_cost', 'fast_latency'],
  enableFallback: true,
  maxFallbackAttempts: 3,
};

const qualityFirstPolicy: RoutingPolicy = {
  key: 'quality_first',
  name: 'Quality First',
  preferredCapabilities: ['strong_reasoning', 'long_context'],
  enableFallback: true,
  maxFallbackAttempts: 3,
};

const speedPriorityPolicy: RoutingPolicy = {
  key: 'speed_priority',
  name: 'Speed Priority',
  maxCost: 0.005,
  maxLatency: 1000,
  preferredCapabilities: ['fast_latency'],
  enableFallback: true,
  maxFallbackAttempts: 2,
};

// Initialize SilentEngine
export const silentEngine = new SilentEngine({
  providers,
  policies: [costOptimizedPolicy, qualityFirstPolicy, speedPriorityPolicy],
  defaultPolicyKey: 'cost_optimized',
});
