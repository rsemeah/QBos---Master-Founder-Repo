/**
 * ConfigEngine™
 *
 * Feature flags, A/B testing, and configuration management for QuietBuild OS.
 *
 * Provides:
 * - Feature flag management with targeting rules
 * - A/B test management with variant assignment
 * - Configuration key-value store
 * - Dynamic configuration updates
 * - Rollout percentage support
 *
 * Event-driven architecture:
 * - Emits: config.flag.*, config.abtest.*, config.config.*
 * - Listens: (none - foundational engine)
 */

import type { EventBus } from '@qbos/events';
import type {
  ConfigEngineConfig,
  FeatureFlag,
  CreateFeatureFlagParams,
  UpdateFeatureFlagParams,
  EvaluateFlagParams,
  EvaluateFlagResult,
  ABTest,
  CreateABTestParams,
  UpdateABTestParams,
  AssignVariantParams,
  AssignVariantResult,
  Config,
  CreateConfigParams,
  UpdateConfigParams,
  GetConfigParams,
  ConfigEngineResult,
  FeatureFlagCreatedEvent,
  FeatureFlagUpdatedEvent,
  FeatureFlagEvaluatedEvent,
  ABTestCreatedEvent,
  ABTestStatusChangedEvent,
  ABTestVariantAssignedEvent,
  ConfigCreatedEvent,
  ConfigUpdatedEvent,
  ABTestVariant,
  ABTestStatus,
} from './types';

export class ConfigEngine {
  private config: ConfigEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();

  constructor(config: Partial<ConfigEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;

    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      cacheEnabled: config.cacheEnabled !== undefined ? config.cacheEnabled : true,
      cacheTTLSeconds: config.cacheTTLSeconds || 300, // 5 minutes
      allowDynamicFlags: config.allowDynamicFlags !== undefined ? config.allowDynamicFlags : true,
      allowSecretAccess: config.allowSecretAccess !== undefined ? config.allowSecretAccess : false,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('ConfigEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[ConfigEngine] Engine is disabled');
      return;
    }

    console.log('[ConfigEngine] Initializing...');

    // Clear cache
    this.cache.clear();

    this.initialized = true;
    console.log('[ConfigEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[ConfigEngine] Shutting down...');

    // Clear cache
    this.cache.clear();

    this.initialized = false;
    console.log('[ConfigEngine] Shutdown complete');
  }

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    if (!this.config.enabled) {
      return { ok: false, message: 'Engine is disabled' };
    }

    if (!this.initialized) {
      return { ok: false, message: 'Engine not initialized' };
    }

    return { ok: true };
  }

  getConfig(): Readonly<ConfigEngineConfig> {
    return { ...this.config };
  }

  // =============================================================================
  // FEATURE FLAG MANAGEMENT
  // =============================================================================

  async createFeatureFlag(params: CreateFeatureFlagParams): Promise<ConfigEngineResult<FeatureFlag>> {
    try {
      if (!this.isValidKey(params.key)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_FLAG_KEY',
            message: 'Flag key must be alphanumeric with underscores/hyphens only',
            details: { key: params.key },
          },
        };
      }

      const existing = await this.getFeatureFlagByKey(params.key);
      if (existing.ok && existing.data) {
        return {
          ok: false,
          error: {
            code: 'FLAG_ALREADY_EXISTS',
            message: 'Feature flag with this key already exists',
            details: { key: params.key },
          },
        };
      }

      const now = new Date().toISOString();
      const flag: FeatureFlag = {
        id: this.generateId('flag'),
        key: params.key,
        name: params.name,
        description: params.description || null,
        enabled: params.enabled !== undefined ? params.enabled : false,
        rolloutPercentage: params.rolloutPercentage || 100,
        targeting: params.targeting || {},
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeFeatureFlag(flag);
      this.emitFeatureFlagCreated(flag);

      return { ok: true, data: flag };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_FLAG_FAILED',
          message: error.message,
        },
      };
    }
  }

  async getFeatureFlagByKey(key: string): Promise<ConfigEngineResult<FeatureFlag>> {
    try {
      const flag = await this.fetchFeatureFlagByKey(key);

      if (!flag) {
        return {
          ok: false,
          error: {
            code: 'FLAG_NOT_FOUND',
            message: 'Feature flag not found',
            details: { key },
          },
        };
      }

      return { ok: true, data: flag };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_FLAG_FAILED',
          message: error.message,
        },
      };
    }
  }

  async updateFeatureFlag(
    flagId: string,
    params: UpdateFeatureFlagParams
  ): Promise<ConfigEngineResult<FeatureFlag>> {
    try {
      const flag = await this.fetchFeatureFlagById(flagId);

      if (!flag) {
        return {
          ok: false,
          error: {
            code: 'FLAG_NOT_FOUND',
            message: 'Feature flag not found',
            details: { flagId },
          },
        };
      }

      const updatedFlag: FeatureFlag = {
        ...flag,
        name: params.name !== undefined ? params.name : flag.name,
        description: params.description !== undefined ? params.description : flag.description,
        enabled: params.enabled !== undefined ? params.enabled : flag.enabled,
        rolloutPercentage:
          params.rolloutPercentage !== undefined ? params.rolloutPercentage : flag.rolloutPercentage,
        targeting: params.targeting !== undefined ? params.targeting : flag.targeting,
        metadata: params.metadata !== undefined ? { ...flag.metadata, ...params.metadata } : flag.metadata,
        updatedAt: new Date().toISOString(),
      };

      await this.storeFeatureFlag(updatedFlag);
      this.invalidateCache(`flag:${flag.key}`);
      this.emitFeatureFlagUpdated(flag.id, flag.key, params);

      return { ok: true, data: updatedFlag };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_FLAG_FAILED',
          message: error.message,
        },
      };
    }
  }

  async evaluateFeatureFlag(params: EvaluateFlagParams): Promise<ConfigEngineResult<EvaluateFlagResult>> {
    try {
      // Check cache
      if (this.config.cacheEnabled) {
        const cached = this.getFromCache<EvaluateFlagResult>(`flag:${params.flagKey}`);
        if (cached !== undefined) {
          return { ok: true, data: cached };
        }
      }

      const flagResult = await this.getFeatureFlagByKey(params.flagKey);

      if (!flagResult.ok || !flagResult.data) {
        return {
          ok: true,
          data: {
            enabled: false,
            reason: 'Flag not found',
          },
        };
      }

      const flag = flagResult.data;

      // Check if flag is globally disabled
      if (!flag.enabled) {
        const result: EvaluateFlagResult = { enabled: false, reason: 'Flag globally disabled' };
        this.emitFeatureFlagEvaluated(flag.key, params.userId || null, false, result.reason);
        return { ok: true, data: result };
      }

      // Check targeting rules
      const targeting = flag.targeting;

      // User ID targeting
      if (targeting.userIds && targeting.userIds.length > 0 && params.userId) {
        if (targeting.userIds.includes(params.userId)) {
          const result: EvaluateFlagResult = { enabled: true, reason: 'User targeted' };
          this.cacheResult(`flag:${params.flagKey}`, result);
          this.emitFeatureFlagEvaluated(flag.key, params.userId, true, result.reason);
          return { ok: true, data: result };
        }
      }

      // Team ID targeting
      if (targeting.teamIds && targeting.teamIds.length > 0 && params.teamId) {
        if (targeting.teamIds.includes(params.teamId)) {
          const result: EvaluateFlagResult = { enabled: true, reason: 'Team targeted' };
          this.cacheResult(`flag:${params.flagKey}`, result);
          this.emitFeatureFlagEvaluated(flag.key, params.userId || null, true, result.reason);
          return { ok: true, data: result };
        }
      }

      // Rollout percentage
      if (flag.rolloutPercentage < 100 && params.userId) {
        const hash = this.hashString(`${flag.key}:${params.userId}`);
        const bucket = hash % 100;

        if (bucket >= flag.rolloutPercentage) {
          const result: EvaluateFlagResult = { enabled: false, reason: 'Outside rollout percentage' };
          this.emitFeatureFlagEvaluated(flag.key, params.userId, false, result.reason);
          return { ok: true, data: result };
        }
      }

      // Default: enabled
      const result: EvaluateFlagResult = { enabled: true, reason: 'Flag enabled for all' };
      this.cacheResult(`flag:${params.flagKey}`, result);
      this.emitFeatureFlagEvaluated(flag.key, params.userId || null, true, result.reason);

      return { ok: true, data: result };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'EVALUATE_FLAG_FAILED',
          message: error.message,
        },
      };
    }
  }

  async listFeatureFlags(): Promise<ConfigEngineResult<FeatureFlag[]>> {
    try {
      const flags = await this.fetchFeatureFlags();
      return { ok: true, data: flags };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'LIST_FLAGS_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // A/B TEST MANAGEMENT
  // =============================================================================

  async createABTest(params: CreateABTestParams): Promise<ConfigEngineResult<ABTest>> {
    try {
      if (!this.isValidKey(params.key)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_TEST_KEY',
            message: 'Test key must be alphanumeric with underscores/hyphens only',
            details: { key: params.key },
          },
        };
      }

      // Validate variant weights sum to 100
      const totalWeight = params.variants.reduce((sum, v) => sum + v.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return {
          ok: false,
          error: {
            code: 'INVALID_VARIANT_WEIGHTS',
            message: 'Variant weights must sum to 100',
            details: { totalWeight },
          },
        };
      }

      const now = new Date().toISOString();
      const test: ABTest = {
        id: this.generateId('test'),
        key: params.key,
        name: params.name,
        description: params.description || null,
        status: 'draft',
        variants: params.variants.map((v) => ({
          id: this.generateId('variant'),
          name: v.name,
          weight: v.weight,
          metadata: v.metadata || {},
        })),
        targeting: params.targeting || {},
        startDate: params.startDate || null,
        endDate: params.endDate || null,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeABTest(test);
      this.emitABTestCreated(test);

      return { ok: true, data: test };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_ABTEST_FAILED',
          message: error.message,
        },
      };
    }
  }

  async updateABTest(testId: string, params: UpdateABTestParams): Promise<ConfigEngineResult<ABTest>> {
    try {
      const test = await this.fetchABTestById(testId);

      if (!test) {
        return {
          ok: false,
          error: {
            code: 'ABTEST_NOT_FOUND',
            message: 'A/B test not found',
            details: { testId },
          },
        };
      }

      const oldStatus = test.status;

      const updatedTest: ABTest = {
        ...test,
        name: params.name !== undefined ? params.name : test.name,
        description: params.description !== undefined ? params.description : test.description,
        status: params.status !== undefined ? params.status : test.status,
        variants: params.variants !== undefined ? params.variants : test.variants,
        targeting: params.targeting !== undefined ? params.targeting : test.targeting,
        startDate: params.startDate !== undefined ? params.startDate : test.startDate,
        endDate: params.endDate !== undefined ? params.endDate : test.endDate,
        metadata: params.metadata !== undefined ? { ...test.metadata, ...params.metadata } : test.metadata,
        updatedAt: new Date().toISOString(),
      };

      await this.storeABTest(updatedTest);

      if (params.status && params.status !== oldStatus) {
        this.emitABTestStatusChanged(test.id, test.key, oldStatus, params.status);
      }

      return { ok: true, data: updatedTest };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_ABTEST_FAILED',
          message: error.message,
        },
      };
    }
  }

  async assignVariant(params: AssignVariantParams): Promise<ConfigEngineResult<AssignVariantResult>> {
    try {
      const test = await this.fetchABTestByKey(params.testKey);

      if (!test) {
        return {
          ok: false,
          error: {
            code: 'ABTEST_NOT_FOUND',
            message: 'A/B test not found',
            details: { testKey: params.testKey },
          },
        };
      }

      if (test.status !== 'running') {
        return {
          ok: false,
          error: {
            code: 'ABTEST_NOT_RUNNING',
            message: 'A/B test is not currently running',
            details: { testKey: params.testKey, status: test.status },
          },
        };
      }

      // Consistent hashing for variant assignment
      const hash = this.hashString(`${params.testKey}:${params.userId}`);
      const bucket = hash % 100;

      let cumulativeWeight = 0;
      let assignedVariant: ABTestVariant | null = null;

      for (const variant of test.variants) {
        cumulativeWeight += variant.weight;
        if (bucket < cumulativeWeight) {
          assignedVariant = variant;
          break;
        }
      }

      if (!assignedVariant) {
        assignedVariant = test.variants[0]; // Fallback to first variant
      }

      const result: AssignVariantResult = {
        variant: assignedVariant,
        reason: 'Consistent hash assignment',
      };

      this.emitABTestVariantAssigned(test.key, params.userId, assignedVariant.id, assignedVariant.name);

      return { ok: true, data: result };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'ASSIGN_VARIANT_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // CONFIGURATION MANAGEMENT
  // =============================================================================

  async createConfig(params: CreateConfigParams): Promise<ConfigEngineResult<Config>> {
    try {
      if (!this.isValidKey(params.key)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_CONFIG_KEY',
            message: 'Config key must be alphanumeric with underscores/hyphens/dots only',
            details: { key: params.key },
          },
        };
      }

      const now = new Date().toISOString();
      const config: Config = {
        id: this.generateId('config'),
        key: params.key,
        value: params.value,
        valueType: params.valueType,
        description: params.description || null,
        isSecret: params.isSecret || false,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      await this.storeConfig(config);
      this.emitConfigCreated(config);

      return { ok: true, data: config };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_CONFIG_FAILED',
          message: error.message,
        },
      };
    }
  }

  async getConfigValue<T = any>(params: GetConfigParams): Promise<ConfigEngineResult<T>> {
    try {
      const config = await this.fetchConfigByKey(params.key);

      if (!config) {
        if (params.defaultValue !== undefined) {
          return { ok: true, data: params.defaultValue as T };
        }

        return {
          ok: false,
          error: {
            code: 'CONFIG_NOT_FOUND',
            message: 'Configuration not found',
            details: { key: params.key },
          },
        };
      }

      if (config.isSecret && !this.config.allowSecretAccess) {
        return {
          ok: false,
          error: {
            code: 'SECRET_ACCESS_DENIED',
            message: 'Access to secret configuration is denied',
            details: { key: params.key },
          },
        };
      }

      return { ok: true, data: config.value as T };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_CONFIG_FAILED',
          message: error.message,
        },
      };
    }
  }

  async updateConfig(configId: string, params: UpdateConfigParams): Promise<ConfigEngineResult<Config>> {
    try {
      const config = await this.fetchConfigById(configId);

      if (!config) {
        return {
          ok: false,
          error: {
            code: 'CONFIG_NOT_FOUND',
            message: 'Configuration not found',
            details: { configId },
          },
        };
      }

      const oldValue = config.value;

      const updatedConfig: Config = {
        ...config,
        value: params.value !== undefined ? params.value : config.value,
        description: params.description !== undefined ? params.description : config.description,
        metadata:
          params.metadata !== undefined ? { ...config.metadata, ...params.metadata } : config.metadata,
        updatedAt: new Date().toISOString(),
      };

      await this.storeConfig(updatedConfig);
      this.invalidateCache(`config:${config.key}`);
      this.emitConfigUpdated(config.id, config.key, oldValue, updatedConfig.value);

      return { ok: true, data: updatedConfig };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_CONFIG_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private isValidKey(key: string): boolean {
    return /^[a-zA-Z0-9_.-]+$/.test(key);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private getFromCache<T>(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    this.cache.delete(key);
    return undefined;
  }

  private cacheResult(key: string, value: any): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.config.cacheTTLSeconds * 1000,
    });
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  // Database stubs
  private async storeFeatureFlag(flag: FeatureFlag): Promise<void> {
    console.log('[ConfigEngine] Store feature flag:', flag.id);
  }

  private async fetchFeatureFlagById(flagId: string): Promise<FeatureFlag | null> {
    console.log('[ConfigEngine] Fetch feature flag by ID:', flagId);
    return null;
  }

  private async fetchFeatureFlagByKey(key: string): Promise<FeatureFlag | null> {
    console.log('[ConfigEngine] Fetch feature flag by key:', key);
    return null;
  }

  private async fetchFeatureFlags(): Promise<FeatureFlag[]> {
    console.log('[ConfigEngine] Fetch all feature flags');
    return [];
  }

  private async storeABTest(test: ABTest): Promise<void> {
    console.log('[ConfigEngine] Store A/B test:', test.id);
  }

  private async fetchABTestById(testId: string): Promise<ABTest | null> {
    console.log('[ConfigEngine] Fetch A/B test by ID:', testId);
    return null;
  }

  private async fetchABTestByKey(key: string): Promise<ABTest | null> {
    console.log('[ConfigEngine] Fetch A/B test by key:', key);
    return null;
  }

  private async storeConfig(config: Config): Promise<void> {
    console.log('[ConfigEngine] Store config:', config.id);
  }

  private async fetchConfigById(configId: string): Promise<Config | null> {
    console.log('[ConfigEngine] Fetch config by ID:', configId);
    return null;
  }

  private async fetchConfigByKey(key: string): Promise<Config | null> {
    console.log('[ConfigEngine] Fetch config by key:', key);
    return null;
  }

  // Event emitters
  private emitFeatureFlagCreated(flag: FeatureFlag): void {
    const payload: FeatureFlagCreatedEvent = {
      flagId: flag.id,
      flagKey: flag.key,
      enabled: flag.enabled,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.flag.created', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit flag.created event:', error);
      });
    });
  }

  private emitFeatureFlagUpdated(
    flagId: string,
    flagKey: string,
    changes: UpdateFeatureFlagParams
  ): void {
    const payload: FeatureFlagUpdatedEvent = {
      flagId,
      flagKey,
      changes,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.flag.updated', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit flag.updated event:', error);
      });
    });
  }

  private emitFeatureFlagEvaluated(
    flagKey: string,
    userId: string | null,
    enabled: boolean,
    reason: string
  ): void {
    const payload: FeatureFlagEvaluatedEvent = {
      flagKey,
      userId,
      enabled,
      reason,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.flag.evaluated', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit flag.evaluated event:', error);
      });
    });
  }

  private emitABTestCreated(test: ABTest): void {
    const payload: ABTestCreatedEvent = {
      testId: test.id,
      testKey: test.key,
      variantCount: test.variants.length,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.abtest.created', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit abtest.created event:', error);
      });
    });
  }

  private emitABTestStatusChanged(
    testId: string,
    testKey: string,
    oldStatus: ABTestStatus,
    newStatus: ABTestStatus
  ): void {
    const payload: ABTestStatusChangedEvent = {
      testId,
      testKey,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.abtest.status_changed', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit abtest.status_changed event:', error);
      });
    });
  }

  private emitABTestVariantAssigned(
    testKey: string,
    userId: string,
    variantId: string,
    variantName: string
  ): void {
    const payload: ABTestVariantAssignedEvent = {
      testKey,
      userId,
      variantId,
      variantName,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.abtest.variant_assigned', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit abtest.variant_assigned event:', error);
      });
    });
  }

  private emitConfigCreated(config: Config): void {
    const payload: ConfigCreatedEvent = {
      configId: config.id,
      configKey: config.key,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.config.created', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit config.created event:', error);
      });
    });
  }

  private emitConfigUpdated(configId: string, configKey: string, oldValue: any, newValue: any): void {
    const payload: ConfigUpdatedEvent = {
      configId,
      configKey,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('config.config.updated', payload).catch((error: any) => {
        console.error('[ConfigEngine] Failed to emit config.updated event:', error);
      });
    });
  }
}

export type { ConfigEngineConfig };
