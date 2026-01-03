"use strict";
/**
 * SilentEngine™ - Routing Engine
 *
 * Core decision engine for intelligent model routing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingEngine = void 0;
const capability_matcher_1 = require("./capability-matcher");
const constraint_evaluator_1 = require("./constraint-evaluator");
class RoutingEngine {
    capabilityMatcher;
    constraintEvaluator;
    circuitBreaker;
    constructor(circuitBreaker) {
        this.capabilityMatcher = new capability_matcher_1.CapabilityMatcher();
        this.constraintEvaluator = new constraint_evaluator_1.ConstraintEvaluator();
        this.circuitBreaker = circuitBreaker;
    }
    /**
     * Route request to best model
     * This is the CORE decision engine
     */
    route(params) {
        const startTime = Date.now();
        // Step 1: Merge required capabilities
        const requiredCapabilities = [
            ...(params.request.requiredCapabilities || []),
            ...(params.policy.requiredCapabilities || []),
        ];
        // Step 2: Merge preferred capabilities
        const preferredCapabilities = [
            ...(params.request.preferredCapabilities || []),
            ...(params.policy.preferredCapabilities || []),
        ];
        // Step 3: Filter by circuit breaker
        const availableModels = params.availableModels.filter((m) => m.enabled && this.circuitBreaker.isAvailable(m.providerKey));
        if (availableModels.length === 0) {
            throw new Error('No available models (all providers down or disabled)');
        }
        // Step 4: Score models by capability match
        const capabilityMatches = this.capabilityMatcher.scoreModels({
            models: availableModels,
            requiredCapabilities,
            preferredCapabilities,
        });
        if (capabilityMatches.length === 0) {
            throw new Error('No models satisfy required capabilities: ' + requiredCapabilities.join(', '));
        }
        // Step 5: Estimate tokens for constraint evaluation
        const estimatedTokensInput = this.constraintEvaluator.estimateTokens(params.request.messages.map((m) => m.content).join(' '));
        const estimatedTokensOutput = params.request.maxLatency ? 1000 : 500; // Rough estimate
        // Step 6: Evaluate constraints and select best model
        const alternativesEvaluated = [];
        let chosenMatch = null;
        let chosenModel = null;
        for (const match of capabilityMatches) {
            const model = availableModels.find((m) => m.modelKey === match.modelKey);
            const constraintEval = this.constraintEvaluator.evaluate({
                model,
                estimatedTokensInput,
                estimatedTokensOutput,
                maxCost: params.request.maxCost || params.policy.maxCostPerRequest,
                maxLatency: params.request.maxLatency || params.policy.maxLatencyMs,
            });
            if (constraintEval.satisfied) {
                // Found viable model
                chosenMatch = match;
                chosenModel = model;
                break;
            }
            else {
                // Record as alternative (rejected)
                alternativesEvaluated.push({
                    provider: match.provider,
                    model: match.modelKey,
                    score: match.score,
                    rejectedReason: constraintEval.violations.join(', '),
                });
            }
        }
        // Step 7: Fallback if no model satisfies constraints
        if (!chosenModel || !chosenMatch) {
            // Degrade: choose cheapest available model
            const cheapestModel = availableModels.sort((a, b) => a.costInputPerMTok - b.costInputPerMTok)[0];
            chosenModel = cheapestModel;
            chosenMatch = capabilityMatches.find((m) => m.modelKey === cheapestModel.modelKey);
            alternativesEvaluated.push({
                provider: chosenModel.providerKey,
                model: chosenModel.modelKey,
                score: chosenMatch?.score || 0,
                rejectedReason: 'degraded_mode_fallback',
            });
        }
        // Step 8: Build decision
        const decision = {
            provider: chosenModel.providerKey,
            model: chosenModel.modelKey,
            policyUsed: params.policy.policyKey,
            reasonCodes: this.buildReasonCodes({
                match: chosenMatch,
                policy: params.policy,
                degraded: alternativesEvaluated.some((a) => a.rejectedReason === 'degraded_mode_fallback'),
            }),
            capabilityMatchScore: chosenMatch.score,
            alternativesEvaluated,
            constraints: {
                maxCost: params.request.maxCost || params.policy.maxCostPerRequest,
                maxLatency: params.request.maxLatency || params.policy.maxLatencyMs,
                requiredCapabilities,
            },
            fallbackUsed: false,
            safetyCheckApplied: params.policy.requireSafetyCheck,
            safetyFlags: [],
            routingLatencyMs: Date.now() - startTime,
            timestamp: new Date(),
        };
        return decision;
    }
    /**
     * Build human-readable reason codes
     */
    buildReasonCodes(params) {
        const codes = [];
        if (params.degraded) {
            codes.push('degraded_mode');
        }
        if (params.match.score === 1.0) {
            codes.push('perfect_capability_match');
        }
        else if (params.match.score >= 0.8) {
            codes.push('high_capability_match');
        }
        else {
            codes.push('partial_capability_match');
        }
        if (params.policy.preferredCapabilities.includes('low_cost')) {
            codes.push('cost_optimized');
        }
        if (params.policy.preferredCapabilities.includes('fast_latency')) {
            codes.push('latency_optimized');
        }
        codes.push('primary_available');
        return codes;
    }
}
exports.RoutingEngine = RoutingEngine;
//# sourceMappingURL=routing-engine.js.map