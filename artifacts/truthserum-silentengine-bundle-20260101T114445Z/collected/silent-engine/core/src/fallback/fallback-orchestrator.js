"use strict";
/**
 * SilentEngine™ - Fallback Orchestrator
 *
 * Manages fallback chains and executes with automatic retry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackOrchestrator = void 0;
class FallbackOrchestrator {
    circuitBreaker;
    constructor(circuitBreaker) {
        this.circuitBreaker = circuitBreaker;
    }
    /**
     * Build fallback chain for a request
     */
    buildFallbackChain(params) {
        const chain = [];
        // Primary
        chain.push({
            provider: params.primaryProvider,
            model: params.primaryModel,
            reason: 'primary_selection',
        });
        if (!params.policy.allowFallback) {
            return chain; // No fallback allowed
        }
        // Find alternative models from same provider
        const sameProviderAlternatives = params.availableModels.filter((m) => m.providerKey === params.primaryProvider &&
            m.modelKey !== params.primaryModel &&
            m.enabled &&
            this.circuitBreaker.isAvailable(m.providerKey));
        for (const alt of sameProviderAlternatives.slice(0, 1)) {
            // Max 1 same-provider fallback
            chain.push({
                provider: alt.providerKey,
                model: alt.modelKey,
                reason: 'same_provider_fallback',
            });
        }
        // Find alternatives from different providers
        const otherProviderAlternatives = params.availableModels.filter((m) => m.providerKey !== params.primaryProvider &&
            m.enabled &&
            this.circuitBreaker.isAvailable(m.providerKey));
        for (const alt of otherProviderAlternatives.slice(0, 2)) {
            // Max 2 cross-provider fallbacks
            chain.push({
                provider: alt.providerKey,
                model: alt.modelKey,
                reason: 'cross_provider_fallback',
            });
        }
        return chain;
    }
    /**
     * Execute with fallback
     */
    async executeWithFallback(chain, executor) {
        let lastError;
        for (let i = 0; i < chain.length; i++) {
            const candidate = chain[i];
            // Check circuit breaker
            if (!this.circuitBreaker.isAvailable(candidate.provider)) {
                continue; // Skip unavailable providers
            }
            try {
                const result = await executor(candidate.provider, candidate.model);
                // Record success
                this.circuitBreaker.recordSuccess(candidate.provider);
                return {
                    result,
                    usedFallback: i > 0,
                    fallbackFrom: i > 0 ? chain[0].model : undefined,
                };
            }
            catch (error) {
                lastError = error;
                // Record failure
                this.circuitBreaker.recordFailure(candidate.provider);
                // Continue to next fallback
                continue;
            }
        }
        // All fallbacks exhausted
        throw new Error(`All providers failed. Last error: ${lastError?.message}`);
    }
}
exports.FallbackOrchestrator = FallbackOrchestrator;
//# sourceMappingURL=fallback-orchestrator.js.map