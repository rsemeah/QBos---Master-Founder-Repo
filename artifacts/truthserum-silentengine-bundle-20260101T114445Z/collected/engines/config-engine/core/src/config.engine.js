"use strict";
/**
 * ConfigEngine™ - Feature Flags and Configuration Management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigEngine = void 0;
class ConfigEngine {
    flags = new Map();
    configs = new Map();
    /**
     * Create or update feature flag
     */
    async setFlag(key, status, options) {
        const existing = this.flags.get(key);
        const now = new Date().toISOString();
        const flag = {
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
    async getFlag(key) {
        return this.flags.get(key) || null;
    }
    /**
     * Check if feature is enabled for context
     */
    async isEnabled(key, context) {
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
    async setConfig(key, value, options) {
        const configKey = options?.scopeId ? `${key}:${options.scope}:${options.scopeId}` : key;
        const config = {
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
    async getConfig(key, options) {
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
    async listFlags() {
        return Array.from(this.flags.values());
    }
    /**
     * Delete flag
     */
    async deleteFlag(key) {
        return this.flags.delete(key);
    }
    // Private helper methods
    evaluateCondition(condition, context) {
        if (!context)
            return false;
        const contextValue = context[condition.type === 'user' ? 'userId' : 'orgId'];
        if (condition.operator === 'equals') {
            return contextValue === condition.value;
        }
        if (condition.operator === 'in' && Array.isArray(condition.value)) {
            return condition.value.includes(contextValue);
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
    inferType(value) {
        if (typeof value === 'string')
            return 'string';
        if (typeof value === 'number')
            return 'number';
        if (typeof value === 'boolean')
            return 'boolean';
        return 'json';
    }
}
exports.ConfigEngine = ConfigEngine;
//# sourceMappingURL=config.engine.js.map