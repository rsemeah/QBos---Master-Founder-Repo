/**
 * SilentEngine™ - Circuit Breaker
 *
 * Prevents cascading failures by tracking provider health
 */

export interface CircuitBreakerConfig {
  failureThreshold: number; // Open after N consecutive failures
  successThreshold: number; // Close after N consecutive successes
  timeoutMs: number; // Time to wait before half-open
}

export interface CircuitState {
  status: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  consecutiveFailures: number;
  lastFailureAt?: Date;
  openedAt?: Date;
}

export class CircuitBreaker {
  private states: Map<string, CircuitState> = new Map();
  private config: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeoutMs: 60000, // 60 seconds
  };

  constructor(config?: Partial<CircuitBreakerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Check if provider is available
   */
  isAvailable(providerKey: string): boolean {
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
  recordSuccess(providerKey: string): void {
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
  recordFailure(providerKey: string): void {
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
  private getState(providerKey: string): CircuitState {
    if (!this.states.has(providerKey)) {
      this.states.set(providerKey, {
        status: 'closed',
        failureCount: 0,
        successCount: 0,
        consecutiveFailures: 0,
      });
    }
    return this.states.get(providerKey)!;
  }

  /**
   * Transition to half-open
   */
  private transitionToHalfOpen(providerKey: string): void {
    const state = this.getState(providerKey);
    state.status = 'half_open';
    state.successCount = 0;
    this.states.set(providerKey, state);
  }

  /**
   * Get state for monitoring
   */
  getStateSnapshot(providerKey: string): CircuitState {
    return { ...this.getState(providerKey) };
  }

  /**
   * Reset circuit (admin override)
   */
  reset(providerKey: string): void {
    this.states.set(providerKey, {
      status: 'closed',
      failureCount: 0,
      successCount: 0,
      consecutiveFailures: 0,
    });
  }
}
