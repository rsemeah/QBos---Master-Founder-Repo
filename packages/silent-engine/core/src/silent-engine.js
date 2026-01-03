"use strict";
/**
 * SilentEngine™ - Main Engine Class
 *
 * Intelligent AI routing orchestrator for QuietBuild OS™
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SilentEngine = void 0;
const routing_engine_1 = require("./routing/routing-engine");
const cost_calculator_1 = require("./routing/cost-calculator");
const circuit_breaker_1 = require("./fallback/circuit-breaker");
const fallback_orchestrator_1 = require("./fallback/fallback-orchestrator");
const safety_classifier_1 = require("./safety/safety-classifier");
const event_emitter_1 = require("./observability/event-emitter");
const audit_logger_1 = require("./observability/audit-logger");
class SilentEngine {
    providers = new Map();
    policies = new Map();
    defaultPolicyKey;
    routingEngine;
    costCalculator;
    circuitBreaker;
    fallbackOrchestrator;
    safetyClassifier;
    eventEmitter;
    auditLogger;
    constructor(config) {
        // Initialize components
        this.circuitBreaker = new circuit_breaker_1.CircuitBreaker();
        this.routingEngine = new routing_engine_1.RoutingEngine(this.circuitBreaker);
        this.costCalculator = new cost_calculator_1.CostCalculator();
        this.fallbackOrchestrator = new fallback_orchestrator_1.FallbackOrchestrator(this.circuitBreaker);
        this.safetyClassifier = new safety_classifier_1.SafetyClassifier();
        this.eventEmitter = new event_emitter_1.EventEmitter();
        this.auditLogger = new audit_logger_1.AuditLogger();
        // Register providers
        for (const provider of config.providers) {
            this.providers.set(provider.providerKey, provider);
        }
        // Register policies
        for (const policy of config.policies) {
            this.policies.set(policy.policyKey, policy);
        }
        this.defaultPolicyKey = config.defaultPolicyKey;
    }
    /**
     * MAIN ENTRY POINT
     * Generate AI response with intelligent routing
     */
    async generate(request) {
        const requestId = request.requestId || this.generateRequestId();
        const startTime = Date.now();
        try {
            // Step 1: Safety check
            const safetyCheck = this.safetyClassifier.check({
                messages: request.messages,
                requireSafetyCheck: request.requireSafetyCheck || false,
            });
            if (safetyCheck.shouldBlock) {
                throw new Error(`Safety check failed: ${safetyCheck.reason}`);
            }
            await this.eventEmitter.emit('silent.safety_check_completed', {
                requestId,
                safe: safetyCheck.safe,
                flags: safetyCheck.flags,
                riskLevel: safetyCheck.riskLevel,
            });
            // Step 2: Load policy
            const policyKey = request.policyKey || this.defaultPolicyKey;
            const policy = this.policies.get(policyKey);
            if (!policy) {
                throw new Error(`Policy not found: ${policyKey}`);
            }
            // Step 3: Get available models
            const availableModels = this.getAllModels();
            // Step 4: Route request
            const routingDecision = this.routingEngine.route({
                request,
                policy,
                availableModels,
            });
            this.auditLogger.logRoutingDecision(routingDecision);
            await this.eventEmitter.emit('silent.routing_completed', {
                requestId,
                provider: routingDecision.provider,
                model: routingDecision.model,
                reasonCodes: routingDecision.reasonCodes,
                capabilityMatchScore: routingDecision.capabilityMatchScore,
            });
            // Step 5: Build fallback chain
            const fallbackChain = this.fallbackOrchestrator.buildFallbackChain({
                primaryProvider: routingDecision.provider,
                primaryModel: routingDecision.model,
                availableModels,
                policy,
            });
            // Step 6: Execute with fallback
            const { result: providerResponse, usedFallback, fallbackFrom } = await this.fallbackOrchestrator.executeWithFallback(fallbackChain, async (provider, model) => {
                const providerInstance = this.providers.get(provider);
                if (!providerInstance) {
                    throw new Error(`Provider not found: ${provider}`);
                }
                return await providerInstance.generate({
                    model,
                    messages: request.messages,
                    systemPrompt: request.systemPrompt,
                    maxTokens: request.maxLatency ? 2000 : 4096,
                    tools: request.tools,
                    stream: false,
                });
            });
            // Step 7: Calculate actual cost
            const modelMetadata = availableModels.find((m) => m.modelKey === routingDecision.model);
            const actualCost = this.costCalculator.calculate({
                model: modelMetadata,
                tokensInput: providerResponse.tokensInput,
                tokensOutput: providerResponse.tokensOutput,
                tokensCacheWrite: providerResponse.tokensCacheWrite,
                tokensCacheRead: providerResponse.tokensCacheRead,
            });
            // Step 8: Build execution result
            const executionResult = {
                requestId,
                provider: routingDecision.provider,
                model: routingDecision.model,
                response: providerResponse,
                actualCost,
                success: true,
                totalLatencyMs: Date.now() - startTime,
                timeToFirstTokenMs: providerResponse.latencyMs,
            };
            this.auditLogger.logExecutionResult(executionResult);
            await this.eventEmitter.emit('silent.execution_completed', {
                requestId,
                provider: routingDecision.provider,
                model: routingDecision.model,
                tokensInput: providerResponse.tokensInput,
                tokensOutput: providerResponse.tokensOutput,
                actualCost,
                latencyMs: executionResult.totalLatencyMs,
                usedFallback,
            });
            return executionResult;
        }
        catch (error) {
            this.auditLogger.logError({
                requestId,
                error,
                context: { request },
            });
            await this.eventEmitter.emit('silent.execution_failed', {
                requestId,
                error: error.message,
                latencyMs: Date.now() - startTime,
            });
            throw error;
        }
    }
    /**
     * Generate with streaming
     */
    async *generateStream(request) {
        const requestId = request.requestId || this.generateRequestId();
        // Same routing logic as generate()
        const policyKey = request.policyKey || this.defaultPolicyKey;
        const policy = this.policies.get(policyKey);
        if (!policy) {
            throw new Error(`Policy not found: ${policyKey}`);
        }
        const availableModels = this.getAllModels();
        const routingDecision = this.routingEngine.route({
            request,
            policy,
            availableModels,
        });
        const provider = this.providers.get(routingDecision.provider);
        if (!provider) {
            throw new Error(`Provider not found: ${routingDecision.provider}`);
        }
        // Stream from provider
        const stream = provider.generateStream({
            model: routingDecision.model,
            messages: request.messages,
            systemPrompt: request.systemPrompt,
            tools: request.tools,
            stream: true,
        });
        for await (const chunk of stream) {
            yield {
                ...chunk,
                metadata: {
                    provider: routingDecision.provider,
                    model: routingDecision.model,
                    requestId,
                },
            };
        }
    }
    /**
     * Health check all providers
     */
    async healthCheck() {
        const results = {};
        for (const [key, provider] of this.providers) {
            try {
                const health = await provider.healthCheck();
                results[key] = health;
            }
            catch (error) {
                results[key] = {
                    available: false,
                    errorMessage: error.message,
                };
            }
        }
        return results;
    }
    /**
     * Get all available models across all providers
     */
    getAllModels() {
        const models = [];
        for (const provider of this.providers.values()) {
            models.push(...provider.getSupportedModels());
        }
        return models;
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Event system access
     */
    get events() {
        return this.eventEmitter;
    }
    /**
     * Audit logs access
     */
    get audit() {
        return this.auditLogger;
    }
    /**
     * Circuit breaker access (admin operations)
     */
    get circuits() {
        return this.circuitBreaker;
    }
}
exports.SilentEngine = SilentEngine;
//# sourceMappingURL=silent-engine.js.map