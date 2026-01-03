"use strict";
/**
 * SilentEngine™ - Base Provider
 *
 * Abstract base class for AI provider implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
class BaseProvider {
    config;
    models = [];
    /**
     * Configure provider with API keys and settings
     */
    configure(config) {
        this.config = config;
    }
    /**
     * Get supported models
     */
    getSupportedModels() {
        return this.models;
    }
    /**
     * Ensure provider is configured
     */
    ensureConfigured() {
        if (!this.config) {
            throw new Error(`Provider ${this.providerKey} not configured. Call configure() first.`);
        }
    }
}
exports.BaseProvider = BaseProvider;
//# sourceMappingURL=base-provider.js.map