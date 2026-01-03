/**
 * ConfigEngine™ - Feature Flags and Configuration Management
 */
import type { FeatureFlag, FeatureFlagStatus, FlagCondition, ConfigValue, FeatureFlagEvaluation } from './types';
export declare class ConfigEngine {
    private flags;
    private configs;
    /**
     * Create or update feature flag
     */
    setFlag(key: string, status: FeatureFlagStatus, options?: {
        description?: string;
        conditions?: FlagCondition[];
    }): Promise<FeatureFlag>;
    /**
     * Get feature flag
     */
    getFlag(key: string): Promise<FeatureFlag | null>;
    /**
     * Check if feature is enabled for context
     */
    isEnabled(key: string, context?: {
        userId?: string;
        orgId?: string;
        [key: string]: unknown;
    }): Promise<FeatureFlagEvaluation>;
    /**
     * Set configuration value
     */
    setConfig(key: string, value: unknown, options?: {
        scope?: ConfigValue['scope'];
        scopeId?: string;
    }): Promise<ConfigValue>;
    /**
     * Get configuration value
     */
    getConfig(key: string, options?: {
        scope?: ConfigValue['scope'];
        scopeId?: string;
        defaultValue?: unknown;
    }): Promise<unknown>;
    /**
     * List all flags
     */
    listFlags(): Promise<FeatureFlag[]>;
    /**
     * Delete flag
     */
    deleteFlag(key: string): Promise<boolean>;
    private evaluateCondition;
    private inferType;
}
//# sourceMappingURL=config.engine.d.ts.map