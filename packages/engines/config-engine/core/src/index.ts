/**
 * @qbos/config-engine-core - ConfigEngine™ Core Package
 *
 * Feature flags, A/B testing, and configuration management for QuietBuild OS.
 *
 * Usage:
 *
 * ```typescript
 * import { ConfigEngine } from '@qbos/config-engine-core';
 * import { InMemoryEventBus } from '@qbos/events';
 *
 * const eventBus = new InMemoryEventBus();
 * const configEngine = new ConfigEngine({
 *   enabled: true,
 *   cacheEnabled: true,
 *   cacheTTLSeconds: 300,
 * }, eventBus);
 *
 * await configEngine.init();
 *
 * // Feature flags
 * await configEngine.createFeatureFlag({
 *   key: 'new_dashboard',
 *   name: 'New Dashboard',
 *   enabled: true,
 *   rolloutPercentage: 50,
 * });
 *
 * const result = await configEngine.evaluateFeatureFlag({
 *   flagKey: 'new_dashboard',
 *   userId: 'user_123',
 * });
 *
 * // A/B testing
 * await configEngine.createABTest({
 *   key: 'button_color_test',
 *   name: 'Button Color Test',
 *   variants: [
 *     { name: 'blue', weight: 50, metadata: {} },
 *     { name: 'green', weight: 50, metadata: {} },
 *   ],
 * });
 *
 * // Configuration
 * await configEngine.createConfig({
 *   key: 'max_upload_size',
 *   value: 10485760,
 *   valueType: 'number',
 * });
 * ```
 */

// Main engine class
export { ConfigEngine } from './config.engine';
export type { ConfigEngineConfig } from './config.engine';

// All types
export type {
  // Feature flag types
  FeatureFlag,
  FlagTargeting,
  CustomRule,
  RuleOperator,
  CreateFeatureFlagParams,
  UpdateFeatureFlagParams,
  EvaluateFlagParams,
  EvaluateFlagResult,

  // A/B test types
  ABTest,
  ABTestStatus,
  ABTestVariant,
  CreateABTestParams,
  UpdateABTestParams,
  AssignVariantParams,
  AssignVariantResult,

  // Configuration types
  Config,
  ConfigValueType,
  CreateConfigParams,
  UpdateConfigParams,
  GetConfigParams,

  // Result types
  ConfigEngineResult,
  ConfigEngineError,

  // Event payload types
  FeatureFlagCreatedEvent,
  FeatureFlagUpdatedEvent,
  FeatureFlagEvaluatedEvent,
  ABTestCreatedEvent,
  ABTestStatusChangedEvent,
  ABTestVariantAssignedEvent,
  ConfigCreatedEvent,
  ConfigUpdatedEvent,
} from './types';
