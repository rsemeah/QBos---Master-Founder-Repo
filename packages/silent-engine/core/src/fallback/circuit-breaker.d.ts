/**
 * SilentEngine™ - Circuit Breaker
 *
 * Prevents cascading failures by tracking provider health
 */
export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeoutMs: number;
}
export interface CircuitState {
    status: 'closed' | 'open' | 'half_open';
    failureCount: number;
    successCount: number;
    consecutiveFailures: number;
    lastFailureAt?: Date;
    openedAt?: Date;
}
export declare class CircuitBreaker {
    private states;
    private config;
    constructor(config?: Partial<CircuitBreakerConfig>);
    /**
     * Check if provider is available
     */
    isAvailable(providerKey: string): boolean;
    /**
     * Record successful request
     */
    recordSuccess(providerKey: string): void;
    /**
     * Record failed request
     */
    recordFailure(providerKey: string): void;
    /**
     * Get current state (creates if not exists)
     */
    private getState;
    /**
     * Transition to half-open
     */
    private transitionToHalfOpen;
    /**
     * Get state for monitoring
     */
    getStateSnapshot(providerKey: string): CircuitState;
    /**
     * Reset circuit (admin override)
     */
    reset(providerKey: string): void;
}
//# sourceMappingURL=circuit-breaker.d.ts.map