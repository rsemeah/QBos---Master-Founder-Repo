# ConfigEngine™

**Feature Flags, A/B Testing, and Configuration Management for QuietBuild OS**

ConfigEngine™ provides comprehensive configuration management capabilities including feature flags with targeting rules, A/B testing with variant assignment, and a flexible key-value configuration store.

## Features

- **Feature Flags** - Toggle features with targeting rules and rollout percentages
- **A/B Testing** - Run experiments with multiple variants and consistent assignment
- **Configuration Store** - Secure key-value storage for application configuration
- **Caching** - Built-in caching for improved performance
- **Event-Driven** - Emits events for all configuration changes
- **Product-Agnostic** - Generic configuration layer

## Installation

```bash
pnpm install @qbos/config-engine-core
```

## Quick Start

### 1. Basic Setup

```typescript
import { ConfigEngine } from '@qbos/config-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const configEngine = new ConfigEngine({
  enabled: true,
  cacheEnabled: true,
  cacheTTLSeconds: 300, // 5 minutes
  allowDynamicFlags: true,
  allowSecretAccess: false,
}, eventBus);

await configEngine.init();
```

### 2. Feature Flags

```typescript
// Create feature flag
await configEngine.createFeatureFlag({
  key: 'new_dashboard',
  name: 'New Dashboard',
  description: 'Enable the redesigned dashboard',
  enabled: true,
  rolloutPercentage: 50,
  targeting: {
    userIds: ['user_123', 'user_456'],
    teamIds: ['team_abc'],
  },
});

// Evaluate flag for user
const result = await configEngine.evaluateFeatureFlag({
  flagKey: 'new_dashboard',
  userId: 'user_789',
});

if (result.ok && result.data?.enabled) {
  // Show new dashboard
}

// Update flag
await configEngine.updateFeatureFlag(flagId, {
  rolloutPercentage: 100, // Roll out to everyone
});

// List all flags
const flags = await configEngine.listFeatureFlags();
```

### 3. A/B Testing

```typescript
// Create A/B test
const test = await configEngine.createABTest({
  key: 'button_color_test',
  name: 'Button Color Test',
  description: 'Test which button color performs better',
  variants: [
    { name: 'blue', weight: 50, metadata: { color: '#0066cc' } },
    { name: 'green', weight: 50, metadata: { color: '#00cc66' } },
  ],
});

// Start the test
await configEngine.updateABTest(test.data!.id, {
  status: 'running',
});

// Assign variant to user
const assignment = await configEngine.assignVariant({
  testKey: 'button_color_test',
  userId: 'user_123',
});

if (assignment.ok) {
  const variant = assignment.data!.variant;
  console.log('Assigned variant:', variant.name);
  console.log('Button color:', variant.metadata.color);
}
```

### 4. Configuration Management

```typescript
// Create configuration
await configEngine.createConfig({
  key: 'max_upload_size',
  value: 10485760, // 10MB
  valueType: 'number',
  description: 'Maximum file upload size in bytes',
});

// Get configuration value
const maxSize = await configEngine.getConfigValue<number>({
  key: 'max_upload_size',
  defaultValue: 5242880, // 5MB default
});

// Update configuration
await configEngine.updateConfig(configId, {
  value: 20971520, // 20MB
});

// Secret configuration
await configEngine.createConfig({
  key: 'api_key',
  value: 'secret-key-here',
  valueType: 'string',
  isSecret: true,
});
```

## Configuration

### ConfigEngineConfig

```typescript
interface ConfigEngineConfig {
  enabled: boolean;              // Enable/disable engine (default: true)
  cacheEnabled: boolean;         // Enable caching (default: true)
  cacheTTLSeconds: number;       // Cache TTL in seconds (default: 300)
  allowDynamicFlags: boolean;    // Allow runtime flag creation (default: true)
  allowSecretAccess: boolean;    // Allow access to secret configs (default: false)
}
```

## Events

### Events Emitted

- **`config.flag.created`** - Feature flag created
- **`config.flag.updated`** - Feature flag updated
- **`config.flag.evaluated`** - Feature flag evaluated for user
- **`config.abtest.created`** - A/B test created
- **`config.abtest.status_changed`** - A/B test status changed
- **`config.abtest.variant_assigned`** - Variant assigned to user
- **`config.config.created`** - Configuration created
- **`config.config.updated`** - Configuration updated

### Subscribing to Events

```typescript
// Track flag evaluations
eventBus.on('config.flag.evaluated', async (event) => {
  console.log(`Flag ${event.flagKey} evaluated: ${event.enabled}`);

  // Track analytics
  await analytics.track({
    event: 'feature_flag_evaluated',
    userId: event.userId,
    properties: {
      flagKey: event.flagKey,
      enabled: event.enabled,
      reason: event.reason,
    },
  });
});

// Track variant assignments
eventBus.on('config.abtest.variant_assigned', async (event) => {
  console.log(`User ${event.userId} assigned to variant ${event.variantName}`);
});
```

## API Reference

### Feature Flags

- `createFeatureFlag(params)` - Create a feature flag
- `getFeatureFlagByKey(key)` - Get flag by key
- `updateFeatureFlag(flagId, params)` - Update flag
- `evaluateFeatureFlag(params)` - Evaluate flag for context
- `listFeatureFlags()` - List all flags

### A/B Testing

- `createABTest(params)` - Create A/B test
- `updateABTest(testId, params)` - Update test
- `assignVariant(params)` - Assign variant to user

### Configuration

- `createConfig(params)` - Create configuration
- `getConfigValue(params)` - Get configuration value
- `updateConfig(configId, params)` - Update configuration

## Best Practices

### 1. Feature Flag Naming

Use descriptive, hierarchical names:

```typescript
const flags = [
  'ui.new_dashboard',
  'api.v2_endpoints',
  'billing.annual_plans',
  'experiments.checkout_flow',
];
```

### 2. Rollout Strategy

Gradually roll out features:

```typescript
// Start with 10%
await configEngine.updateFeatureFlag(flagId, {
  rolloutPercentage: 10,
});

// Monitor metrics, increase to 50%
await configEngine.updateFeatureFlag(flagId, {
  rolloutPercentage: 50,
});

// Full rollout
await configEngine.updateFeatureFlag(flagId, {
  rolloutPercentage: 100,
});
```

### 3. A/B Test Variants

Keep variant weights balanced initially:

```typescript
const variants = [
  { name: 'control', weight: 50, metadata: {} },
  { name: 'variant_a', weight: 25, metadata: {} },
  { name: 'variant_b', weight: 25, metadata: {} },
];
```

### 4. Configuration Types

Use appropriate value types:

```typescript
// Number
await configEngine.createConfig({
  key: 'rate_limit',
  value: 1000,
  valueType: 'number',
});

// Boolean
await configEngine.createConfig({
  key: 'maintenance_mode',
  value: false,
  valueType: 'boolean',
});

// JSON
await configEngine.createConfig({
  key: 'feature_limits',
  value: { free: 10, pro: 100, enterprise: 1000 },
  valueType: 'json',
});
```

## Examples

### Gradual Feature Rollout

```typescript
// Create flag with 0% rollout
const flag = await configEngine.createFeatureFlag({
  key: 'new_editor',
  name: 'New Editor',
  enabled: true,
  rolloutPercentage: 0,
  targeting: {
    userIds: ['internal_team_member_1', 'internal_team_member_2'],
  },
});

// Internal team can always access
// Gradually increase rollout based on metrics
await configEngine.updateFeatureFlag(flag.data!.id, {
  rolloutPercentage: 25,
});
```

### Multi-Variant A/B Test

```typescript
const test = await configEngine.createABTest({
  key: 'pricing_page_test',
  name: 'Pricing Page Variations',
  variants: [
    { name: 'original', weight: 33.33, metadata: { layout: 'vertical' } },
    { name: 'horizontal', weight: 33.33, metadata: { layout: 'horizontal' } },
    { name: 'comparison', weight: 33.34, metadata: { layout: 'comparison_table' } },
  ],
});

await configEngine.updateABTest(test.data!.id, { status: 'running' });

// Consistent assignment
const variant = await configEngine.assignVariant({
  testKey: 'pricing_page_test',
  userId: 'user_123',
});
```

## Database Schema

See `packages/engines/config-engine/supabase/README.md` for database schema documentation.

## License

MIT
