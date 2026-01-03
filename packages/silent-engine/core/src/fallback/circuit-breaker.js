"use strict";
/**
 * SilentEngine™ - Circuit Breaker
 *
 * Prevents cascading failures by tracking provider health
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
class CircuitBreaker {
    states = new Map();
    config = {
        failureThreshold: 5,
        successThreshold: 2,
        timeoutMs: 60000, // 60 seconds
    };
    constructor(config) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }
    /**
     * Check if provider is available
     */
    isAvailable(providerKey) {
        const state = this.getState(providerKey);
        if (state.status === 'closed') {
            return true;
        }
        if (state.status === 'open') {
            // Check if timeout expired
            if (state.openedAt) {
                const elapsed = Date.now() - state.openedAt.getTime();
                if (elapsed >= this.config.timeoutMs) {
                    // Transition to half-open
                    this.transitionToHalfOpen(providerKey);
                    return true;
                }
            }
            return false;
        }
        if (state.status === 'half_open') {
            // Allow limited requests in half-open state
            return true;
        }
        return false;
    }
    /**
     * Record successful request
     */
    recordSuccess(providerKey) {
        const state = this.getState(providerKey);
        state.successCount++;
        state.consecutiveFailures = 0;
        if (state.status === 'half_open') {
            if (state.successCount >= this.config.successThreshold) {
                // Close circuit
                state.status = 'closed';
                state.successCount = 0;
                state.failureCount = 0;
            }
        }
        this.states.set(providerKey, state);
    }
    /**
     * Record failed request
     */
    recordFailure(providerKey) {
        const state = this.getState(providerKey);
        state.failureCount++;
        state.consecutiveFailures++;
        state.lastFailureAt = new Date();
        if (state.consecutiveFailures >= this.config.failureThreshold) {
            // Open circuit
            state.status = 'open';
            state.openedAt = new Date();
            state.successCount = 0;
        }
        this.states.set(providerKey, state);
    }
    /**
     * Get current state (creates if not exists)
     */
    getState(providerKey) {
        if (!this.states.has(providerKey)) {
            this.states.set(providerKey, {
                status: 'closed',
                failureCount: 0,
                successCount: 0,
                consecutiveFailures: 0,
            });
        }
        return this.states.get(providerKey);
    }
    /**
     * Transition to half-open
     */
    transitionToHalfOpen(providerKey) {
        const state = this.getState(providerKey);
        state.status = 'half_open';
        state.successCount = 0;
        this.states.set(providerKey, state);
    }
    /**
     * Get state for monitoring
     */
    getStateSnapshot(providerKey) {
        return { ...this.getState(providerKey) };
    }
    /**
     * Reset circuit (admin override)
     */
    reset(providerKey) {
        this.states.set(providerKey, {
            status: 'closed',
            failureCount: 0,
            successCount: 0,
            consecutiveFailures: 0,
        });
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map