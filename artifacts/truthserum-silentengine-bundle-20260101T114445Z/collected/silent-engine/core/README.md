# SilentEngine™

**Intelligent AI Routing for QuietBuild OS™**

SilentEngine™ is a production-ready AI routing orchestrator that intelligently selects the best model for each request based on capabilities, cost, latency, and availability.

## Quick Start

```typescript
import { SilentEngine } from '@qbos/silent-engine-core';

// Define routing policies
const costOptimized = {
  policyKey: 'cost_optimized',
  displayName: 'Cost Optimized',
  description: 'Minimize cost while meeting requirements',
  maxCostPerRequest: 0.001,
  maxLatencyMs: 5000,
  preferredCapabilities: ['low_cost', 'fast_latency'],
  requiredCapabilities: [],
  allowFallback: true,
  requireSafetyCheck: false,
  minSafetyLevel: 'low'
};

// Initialize engine (providers configured separately)
const silentEngine = new SilentEngine({
  providers: [anthropic, openai, google], // Provider instances
  policies: [costOptimized],
  defaultPolicyKey: 'cost_optimized'
});

// Generate response
const result = await silentEngine.generate({
  requestId: 'req-001',
  messages: [
    { role: 'user', content: 'Explain quantum computing in simple terms' }
  ],
  policyKey: 'cost_optimized',
  maxCost: 0.001,
  maxLatency: 3000
});

console.log(result.response.text);
console.log('Cost:', result.actualCost);
console.log('Latency:', result.totalLatencyMs);
console.log('Provider:', result.provider);
console.log('Model:', result.model);
```

## Core Features

### 1. Capability-Based Routing

Routes requests based on model capabilities:

- `long_context` - 100K+ token context
- `tool_use` - Function calling
- `vision` - Image understanding
- `streaming` - Streaming responses
- `code_generation` - Code-focused models
- `strong_reasoning` - Complex reasoning (e.g., Claude Opus, o1)
- `high_quality` - Top-tier quality
- `low_cost` - Cost-optimized
- `fast_latency` - Low latency

```typescript
const result = await silentEngine.generate({
  messages: [{ role: 'user', content: 'Write a complex algorithm' }],
  requiredCapabilities: ['code_generation'],
  preferredCapabilities: ['strong_reasoning', 'low_cost']
});
```

### 2. Cost & Latency Constraints

```typescript
const result = await silentEngine.generate({
  messages: [{ role: 'user', content: 'Summarize this document' }],
  maxCost: 0.0005,      // Max $0.0005 per request
  maxLatency: 2000       // Max 2 seconds
});
```

### 3. Circuit Breaker & Fallback

Automatically fails over to backup providers when primary fails:

```typescript
// Circuit opens after 5 consecutive failures
// Automatically retries after 60 seconds (half-open state)
// Falls back to alternative models/providers
```

### 4. Safety Checks

Built-in safety classifier detects:

- PII (SSN, credit cards, emails, phone numbers)
- Jailbreak attempts
- High-risk topics
- Excessive input length (DoS prevention)

```typescript
const result = await silentEngine.generate({
  messages: [{ role: 'user', content: 'Process this user data' }],
  requireSafetyCheck: true
});
```

### 5. Observability

Event-driven architecture for monitoring and integration:

```typescript
silentEngine.events.on('silent.routing_completed', async (event) => {
  console.log('Routing decision:', event.payload);
  // Send to analytics, SightEngine, etc.
});

silentEngine.events.on('silent.execution_completed', async (event) => {
  console.log('Execution result:', event.payload);
  // Track costs, performance metrics
});

silentEngine.events.on('silent.execution_failed', async (event) => {
  console.log('Execution failed:', event.payload);
  // Alert, retry logic
});
```

### 6. Audit Logging

Complete audit trail of all routing decisions and executions:

```typescript
const logs = silentEngine.audit.getLogs({
  requestId: 'req-001',
  limit: 10
});

console.log('Routing decisions:', logs);
```

## Routing Policies

Policies define routing behavior:

```typescript
const qualityFirst = {
  policyKey: 'quality_first',
  displayName: 'Quality First',
  description: 'Maximize quality, cost secondary',
  maxCostPerRequest: 0.05,
  maxLatencyMs: 10000,
  preferredCapabilities: ['strong_reasoning', 'high_quality'],
  requiredCapabilities: [],
  allowFallback: true,
  requireSafetyCheck: true,
  minSafetyLevel: 'high'
};
```

## Streaming Support

```typescript
const stream = silentEngine.generateStream({
  messages: [{ role: 'user', content: 'Write a story about a robot' }],
  policyKey: 'cost_optimized'
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);

  if (chunk.isDone) {
    console.log('\nProvider:', chunk.metadata?.provider);
    console.log('Model:', chunk.metadata?.model);
  }
}
```

## Health Checks

```typescript
const health = await silentEngine.healthCheck();
console.log('Provider health:', health);

// Example output:
// {
//   anthropic: { available: true, latencyMs: 234 },
//   openai: { available: true, latencyMs: 189 },
//   google: { available: false, errorMessage: 'Timeout' }
// }
```

## Circuit Breaker Administration

```typescript
// Get circuit state
const state = silentEngine.circuits.getStateSnapshot('anthropic');
console.log(state);

// Reset circuit (admin override)
silentEngine.circuits.reset('anthropic');
```

## Architecture

SilentEngine™ consists of:

1. **Routing Engine** - Core decision logic
2. **Capability Matcher** - Scores models by capability fit
3. **Constraint Evaluator** - Enforces cost/latency limits
4. **Circuit Breaker** - Tracks provider health
5. **Fallback Orchestrator** - Manages fallback chains
6. **Safety Classifier** - Detects security risks
7. **Event Emitter** - Observability hooks
8. **Audit Logger** - Complete audit trail

## How Routing Works

```
Request → Safety Check → Load Policy → Score Models → Evaluate Constraints
       → Choose Best Model → Build Fallback Chain → Execute with Retry
       → Calculate Cost → Return Result → Emit Events → Log Audit
```

## Adding New Providers

Extend `BaseProvider`:

```typescript
import { BaseProvider } from '@qbos/silent-engine-core';

export class GroqProvider extends BaseProvider {
  readonly providerKey = 'groq';
  readonly displayName = 'Groq';

  // Implement: generate(), generateStream(), healthCheck()
}
```

## Philosophy

**SilentEngine™ makes intelligent decisions so you don't have to.**

- **Deterministic** - Same input = same routing decision
- **Composable** - Providers, policies, constraints plug together
- **Observable** - Every decision emits events
- **Replaceable** - Swap providers without code changes
- **Explainable** - Reason codes + audit trail
- **Production-ready** - Circuit breaker, fallback, cost tracking

## Building

```bash
cd packages/silent-engine/core
npm install
npm run build
```

## License

MIT
