/**
 * SilentEngine™ - Main Engine Class
 *
 * Intelligent AI routing orchestrator for QuietBuild OS™
 */
import { RoutingRequest, ExecutionResult, RoutingPolicy, ProviderInterface } from './types';
import { CircuitBreaker } from './fallback/circuit-breaker';
import { EventEmitter } from './observability/event-emitter';
import { AuditLogger } from './observability/audit-logger';
export interface SilentEngineConfig {
    providers: ProviderInterface[];
    policies: RoutingPolicy[];
    defaultPolicyKey: string;
}
export declare class SilentEngine {
    private providers;
    private policies;
    private defaultPolicyKey;
    private routingEngine;
    private costCalculator;
    private circuitBreaker;
    private fallbackOrchestrator;
    private safetyClassifier;
    private eventEmitter;
    private auditLogger;
    constructor(config: SilentEngineConfig);
    /**
     * MAIN ENTRY POINT
     * Generate AI response with intelligent routing
     */
    generate(request: RoutingRequest): Promise<ExecutionResult>;
    /**
     * Generate with streaming
     */
    generateStream(request: RoutingRequest): AsyncIterable<{
        text: string;
        isDone: boolean;
        metadata?: {
            provider: string;
            model: string;
            requestId: string;
        };
    }>;
    /**
     * Health check all providers
     */
    healthCheck(): Promise<Record<string, {
        available: boolean;
        latencyMs?: number;
    }>>;
    /**
     * Get all available models across all providers
     */
    private getAllModels;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
    /**
     * Event system access
     */
    get events(): EventEmitter;
    /**
     * Audit logs access
     */
    get audit(): AuditLogger;
    /**
     * Circuit breaker access (admin operations)
     */
    get circuits(): CircuitBreaker;
}
//# sourceMappingURL=silent-engine.d.ts.map