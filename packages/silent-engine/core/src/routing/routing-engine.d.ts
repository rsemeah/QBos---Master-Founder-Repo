/**
 * SilentEngine™ - Routing Engine
 *
 * Core decision engine for intelligent model routing
 */
import { RoutingRequest, RoutingDecision, RoutingPolicy, ModelMetadata } from '../types';
import { CircuitBreaker } from '../fallback/circuit-breaker';
export declare class RoutingEngine {
    private capabilityMatcher;
    private constraintEvaluator;
    private circuitBreaker;
    constructor(circuitBreaker: CircuitBreaker);
    /**
     * Route request to best model
     * This is the CORE decision engine
     */
    route(params: {
        request: RoutingRequest;
        policy: RoutingPolicy;
        availableModels: ModelMetadata[];
    }): RoutingDecision;
    /**
     * Build human-readable reason codes
     */
    private buildReasonCodes;
}
//# sourceMappingURL=routing-engine.d.ts.map