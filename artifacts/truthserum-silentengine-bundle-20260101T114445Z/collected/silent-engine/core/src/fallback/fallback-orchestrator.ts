/**
 * SilentEngine™ - Fallback Orchestrator
 *
 * Manages fallback chains and executes with automatic retry
 */

import { RoutingPolicy, ModelMetadata } from '../types';
import { CircuitBreaker } from './circuit-breaker';

export interface FallbackCandidate {
  provider: string;
  model: string;
  reason: string;
}

export class FallbackOrchestrator {
  constructor(private circuitBreaker: CircuitBreaker) {}

  /**
   * Build fallback chain for a request
   */
  buildFallbackChain(params: {
    primaryProvider: string;
    primaryModel: string;
    availableModels: ModelMetadata[];
    policy: RoutingPolicy;
  }): FallbackCandidate[] {
    const chain: FallbackCandidate[] = [];

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
    const sameProviderAlternatives = params.availableModels.filter(
      (m) =>
        m.providerKey === params.primaryProvider &&
        m.modelKey !== params.primaryModel &&
        m.enabled &&
        this.circuitBreaker.isAvailable(m.providerKey)
    );

    for (const alt of sameProviderAlternatives.slice(0, 1)) {
      // Max 1 same-provider fallback
      chain.push({
        provider: alt.providerKey,
        model: alt.modelKey,
        reason: 'same_provider_fallback',
      });
    }

    // Find alternatives from different providers
    const otherProviderAlternatives = params.availableModels.filter(
      (m) =>
        m.providerKey !== params.primaryProvider &&
        m.enabled &&
        this.circuitBreaker.isAvailable(m.providerKey)
    );

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
  async executeWithFallback<T>(
    chain: FallbackCandidate[],
    executor: (provider: string, model: string) => Promise<T>
  ): Promise<{ result: T; usedFallback: boolean; fallbackFrom?: string }> {
    let lastError: Error | undefined;

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
      } catch (error: any) {
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
