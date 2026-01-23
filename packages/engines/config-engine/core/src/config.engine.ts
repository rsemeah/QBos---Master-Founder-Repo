/**
 * ConfigEngine™ - Feature Flags and Configuration Management
 */

import { ReceiptWriter } from '@qbos/truthserum';
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
      sessionId?: string;
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

    // Emit TruthSerum receipt
    await ReceiptWriter.writeReceipt({
      sessionId: options?.sessionId || key,
      type: 'config.flag.updated',
      details: {
        flag_key: key,
        status,
        is_new: !existing,
        description: options?.description,
        has_conditions: !!options?.conditions
      }
    });

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
      sessionId?: string;
      [key: string]: unknown;
    }
  ): Promise<FeatureFlagEvaluation> {
    const flag = this.flags.get(key);

    if (!flag) {
      const result = {
        key,
        enabled: false,
        reason: 'Flag not found',
      };

      // Emit receipt
      await ReceiptWriter.writeReceipt({
        sessionId: context?.sessionId || context?.userId || key,
        type: 'config.flag.evaluated',
        details: {
          flag_key: key,
          enabled: false,
          reason: 'Flag not found',
          context_user_id: context?.userId,
          context_org_id: context?.orgId
        }
      });

      return result;
    }

    if (flag.status === 'disabled') {
      const result = {
        key,
        enabled: false,
        reason: 'Flag is disabled',
      };

      await ReceiptWriter.writeReceipt({
        sessionId: context?.sessionId || context?.userId || key,
        type: 'config.flag.evaluated',
        details: {
          flag_key: key,
          enabled: false,
          reason: 'Flag is disabled',
          context_user_id: context?.userId,
          context_org_id: context?.orgId
        }
      });

      return result;
    }

    if (flag.status === 'enabled') {
      const result = {
        key,
        enabled: true,
        reason: 'Flag is globally enabled',
      };

      await ReceiptWriter.writeReceipt({
        sessionId: context?.sessionId || context?.userId || key,
        type: 'config.flag.evaluated',
        details: {
          flag_key: key,
          enabled: true,
          reason: 'Flag is globally enabled',
          context_user_id: context?.userId,
          context_org_id: context?.orgId
        }
      });

      return result;
    }

    // Conditional evaluation
    if (flag.status === 'conditional' && flag.conditions) {
      for (const condition of flag.conditions) {
        if (this.evaluateCondition(condition, context)) {
          const result = {
            key,
            enabled: true,
            reason: 'Condition matched',
            matchedCondition: condition,
          };

          await ReceiptWriter.writeReceipt({
            sessionId: context?.sessionId || context?.userId || key,
            type: 'config.flag.evaluated',
            details: {
              flag_key: key,
              enabled: true,
              reason: 'Condition matched',
              matched_condition: condition,
              context_user_id: context?.userId,
              context_org_id: context?.orgId
            }
          });

          return result;
        }
      }
    }

    const result = {
      key,
      enabled: false,
      reason: 'No conditions matched',
    };

    await ReceiptWriter.writeReceipt({
      sessionId: context?.sessionId || context?.userId || key,
      type: 'config.flag.evaluated',
      details: {
        flag_key: key,
        enabled: false,
        reason: 'No conditions matched',
        context_user_id: context?.userId,
        context_org_id: context?.orgId
      }
    });

    return result;
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
      sessionId?: string;
    }
  ): Promise<ConfigValue> {
    const configKey = options?.scopeId ? `${key}:${options.scope}:${options.scopeId}` : key;
    const existing = this.configs.get(configKey);

    const config: ConfigValue = {
      key,
      value,
      type: this.inferType(value),
      scope: options?.scope || 'global',
      scopeId: options?.scopeId,
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(configKey, config);

    // Emit TruthSerum receipt
    await ReceiptWriter.writeReceipt({
      sessionId: options?.sessionId || options?.scopeId || key,
      type: 'config.value.set',
      details: {
        config_key: key,
        value_type: config.type,
        scope: config.scope,
        scope_id: config.scopeId,
        is_new: !existing
      }
    });

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
