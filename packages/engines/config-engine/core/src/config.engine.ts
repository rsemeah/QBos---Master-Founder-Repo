/**
 * ConfigEngine™ - Feature Flags and Configuration Management
 */

import type {
  FeatureFlag,
  FeatureFlagStatus,
  FlagCondition,
  ConfigValue,
  FeatureFlagEvaluation,
} from './types';

export class ConfigEngine {
  private flags: Map<string, FeatureFlag> = new Map();
  private configs: Map<string, ConfigValue> = new Map();

  /**
   * Create or update feature flag
   */
  async setFlag(
    key: string,
    status: FeatureFlagStatus,
    options?: {
      description?: string;
      conditions?: FlagCondition[];
    }
  ): Promise<FeatureFlag> {
    const existing = this.flags.get(key);
    const now = new Date().toISOString();

    const flag: FeatureFlag = {
      key,
      status,
      description: options?.description,
      conditions: options?.conditions,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.flags.set(key, flag);
    return flag;
  }

  /**
   * Get feature flag
   */
  async getFlag(key: string): Promise<FeatureFlag | null> {
    return this.flags.get(key) || null;
  }

  /**
   * Check if feature is enabled for context
   */
  async isEnabled(
    key: string,
    context?: {
      userId?: string;
      orgId?: string;
      [key: string]: unknown;
    }
  ): Promise<FeatureFlagEvaluation> {
    const flag = this.flags.get(key);

    if (!flag) {
      return {
        key,
        enabled: false,
        reason: 'Flag not found',
      };
    }

    if (flag.status === 'disabled') {
      return {
        key,
        enabled: false,
        reason: 'Flag is disabled',
      };
    }

    if (flag.status === 'enabled') {
      return {
        key,
        enabled: true,
        reason: 'Flag is globally enabled',
      };
    }

    // Conditional evaluation
    if (flag.status === 'conditional' && flag.conditions) {
      for (const condition of flag.conditions) {
        if (this.evaluateCondition(condition, context)) {
          return {
            key,
            enabled: true,
            reason: 'Condition matched',
            matchedCondition: condition,
          };
        }
      }
    }

    return {
      key,
      enabled: false,
      reason: 'No conditions matched',
    };
  }

  /**
   * Set configuration value
   */
  async setConfig(
    key: string,
    value: unknown,
    options?: {
      scope?: ConfigValue['scope'];
      scopeId?: string;
    }
  ): Promise<ConfigValue> {
    const configKey = options?.scopeId ? `${key}:${options.scope}:${options.scopeId}` : key;

    const config: ConfigValue = {
      key,
      value,
      type: this.inferType(value),
      scope: options?.scope || 'global',
      scopeId: options?.scopeId,
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(configKey, config);
    return config;
  }

  /**
   * Get configuration value
   */
  async getConfig(
    key: string,
    options?: {
      scope?: ConfigValue['scope'];
      scopeId?: string;
      defaultValue?: unknown;
    }
  ): Promise<unknown> {
    const configKey = options?.scopeId ? `${key}:${options.scope}:${options.scopeId}` : key;
    const config = this.configs.get(configKey);

    if (!config) {
      // Fall back to global if scoped not found
      if (options?.scopeId) {
        const globalConfig = this.configs.get(key);
        return globalConfig?.value ?? options.defaultValue;
      }
      return options?.defaultValue;
    }

    return config.value;
  }

  /**
   * List all flags
   */
  async listFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  /**
   * Delete flag
   */
  async deleteFlag(key: string): Promise<boolean> {
    return this.flags.delete(key);
  }

  // Private helper methods

  private evaluateCondition(
    condition: FlagCondition,
    context?: Record<string, unknown>
  ): boolean {
    if (!context) return false;

    const contextValue = context[condition.type === 'user' ? 'userId' : 'orgId'];

    if (condition.operator === 'equals') {
      return contextValue === condition.value;
    }

    if (condition.operator === 'in' && Array.isArray(condition.value)) {
      return condition.value.includes(contextValue as string);
    }

    if (typeof condition.value === 'number' && typeof contextValue === 'number') {
      switch (condition.operator) {
        case 'lt':
          return contextValue < condition.value;
        case 'lte':
          return contextValue <= condition.value;
        case 'gt':
          return contextValue > condition.value;
        case 'gte':
          return contextValue >= condition.value;
      }
    }

    return false;
  }

  private inferType(value: unknown): ConfigValue['type'] {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'json';
  }
}
