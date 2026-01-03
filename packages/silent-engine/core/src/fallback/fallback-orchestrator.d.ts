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
export declare class FallbackOrchestrator {
    private circuitBreaker;
    constructor(circuitBreaker: CircuitBreaker);
    /**
     * Build fallback chain for a request
     */
    buildFallbackChain(params: {
        primaryProvider: string;
        primaryModel: string;
        availableModels: ModelMetadata[];
        policy: RoutingPolicy;
    }): FallbackCandidate[];
    /**
     * Execute with fallback
     */
    executeWithFallback<T>(chain: FallbackCandidate[], executor: (provider: string, model: string) => Promise<T>): Promise<{
        result: T;
        usedFallback: boolean;
        fallbackFrom?: string;
    }>;
}
//# sourceMappingURL=fallback-orchestrator.d.ts.map