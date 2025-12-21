/**
 * ConfigEngine Types
 *
 * Complete type definitions for the ConfigEngine.
 * Feature flags, A/B testing, and configuration management.
 */

// =============================================================================
// FEATURE FLAG TYPES
// =============================================================================

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  targeting: FlagTargeting;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FlagTargeting {
  userIds?: string[];
  teamIds?: string[];
  roles?: string[];
  customRules?: CustomRule[];
}

export interface CustomRule {
  attribute: string;
  operator: RuleOperator;
  value: any;
}

export type RuleOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';

export interface CreateFeatureFlagParams {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  targeting?: FlagTargeting;
  metadata?: Record<string, any>;
}

export interface UpdateFeatureFlagParams {
  name?: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  targeting?: FlagTargeting;
  metadata?: Record<string, any>;
}

export interface EvaluateFlagParams {
  flagKey: string;
  userId?: string;
  teamId?: string;
  context?: Record<string, any>;
}

export interface EvaluateFlagResult {
  enabled: boolean;
  variant?: string;
  reason: string;
}

// =============================================================================
// A/B TEST TYPES
// =============================================================================

export interface ABTest {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ABTestStatus;
  variants: ABTestVariant[];
  targeting: FlagTargeting;
  startDate: string | null;
  endDate: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  metadata: Record<string, any>;
}

export interface CreateABTestParams {
  key: string;
  name: string;
  description?: string;
  variants: Omit<ABTestVariant, 'id'>[];
  targeting?: FlagTargeting;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

export interface UpdateABTestParams {
  name?: string;
  description?: string;
  status?: ABTestStatus;
  variants?: ABTestVariant[];
  targeting?: FlagTargeting;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

export interface AssignVariantParams {
  testKey: string;
  userId: string;
  context?: Record<string, any>;
}

export interface AssignVariantResult {
  variant: ABTestVariant;
  reason: string;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface Config {
  id: string;
  key: string;
  value: any;
  valueType: ConfigValueType;
  description: string | null;
  isSecret: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'array';

export interface CreateConfigParams {
  key: string;
  value: any;
  valueType: ConfigValueType;
  description?: string;
  isSecret?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateConfigParams {
  value?: any;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GetConfigParams {
  key: string;
  defaultValue?: any;
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

export interface ConfigEngineConfig {
  enabled: boolean;
  cacheEnabled: boolean;
  cacheTTLSeconds: number;
  allowDynamicFlags: boolean;
  allowSecretAccess: boolean;
}

// =============================================================================
// ENGINE RESULT TYPES
// =============================================================================

export interface ConfigEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: ConfigEngineError;
}

export interface ConfigEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// =============================================================================
// EVENT PAYLOAD TYPES
// =============================================================================

export interface FeatureFlagCreatedEvent {
  flagId: string;
  flagKey: string;
  enabled: boolean;
  timestamp: string;
}

export interface FeatureFlagUpdatedEvent {
  flagId: string;
  flagKey: string;
  changes: Partial<UpdateFeatureFlagParams>;
  timestamp: string;
}

export interface FeatureFlagEvaluatedEvent {
  flagKey: string;
  userId: string | null;
  enabled: boolean;
  reason: string;
  timestamp: string;
}

export interface ABTestCreatedEvent {
  testId: string;
  testKey: string;
  variantCount: number;
  timestamp: string;
}

export interface ABTestStatusChangedEvent {
  testId: string;
  testKey: string;
  oldStatus: ABTestStatus;
  newStatus: ABTestStatus;
  timestamp: string;
}

export interface ABTestVariantAssignedEvent {
  testKey: string;
  userId: string;
  variantId: string;
  variantName: string;
  timestamp: string;
}

export interface ConfigCreatedEvent {
  configId: string;
  configKey: string;
  timestamp: string;
}

export interface ConfigUpdatedEvent {
  configId: string;
  configKey: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}
