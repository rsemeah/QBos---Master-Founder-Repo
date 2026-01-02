/**
 * SilentEngine™ - Main Engine Class
 *
 * Intelligent AI routing orchestrator for QuietBuild OS™
 */

import {
  RoutingRequest,
  RoutingDecision,
  ExecutionResult,
  RoutingPolicy,
  ModelMetadata,
  ProviderInterface,
} from './types';
import { RoutingEngine } from './routing/routing-engine';
import { CostCalculator } from './routing/cost-calculator';
import { CircuitBreaker } from './fallback/circuit-breaker';
import { FallbackOrchestrator } from './fallback/fallback-orchestrator';
import { SafetyClassifier } from './safety/safety-classifier';
import { EventEmitter } from './observability/event-emitter';
import { AuditLogger } from './observability/audit-logger';

export interface SilentEngineConfig {
  providers: ProviderInterface[];
  policies: RoutingPolicy[];
  defaultPolicyKey: string;
}

export class SilentEngine {
  private providers: Map<string, ProviderInterface> = new Map();
  private policies: Map<string, RoutingPolicy> = new Map();
  private defaultPolicyKey: string;

  private routingEngine: RoutingEngine;
  private costCalculator: CostCalculator;
  private circuitBreaker: CircuitBreaker;
  private fallbackOrchestrator: FallbackOrchestrator;
  private safetyClassifier: SafetyClassifier;
  private eventEmitter: EventEmitter;
  private auditLogger: AuditLogger;

  constructor(config: SilentEngineConfig) {
    // Initialize components
    this.circuitBreaker = new CircuitBreaker();
    this.routingEngine = new RoutingEngine(this.circuitBreaker);
    this.costCalculator = new CostCalculator();
    this.fallbackOrchestrator = new FallbackOrchestrator(this.circuitBreaker);
    this.safetyClassifier = new SafetyClassifier();
    this.eventEmitter = new EventEmitter();
    this.auditLogger = new AuditLogger();

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
  async generate(request: RoutingRequest): Promise<ExecutionResult> {
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
      const { result: providerResponse, usedFallback, fallbackFrom } =
        await this.fallbackOrchestrator.executeWithFallback(
          fallbackChain,
          async (provider, model) => {
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
          }
        );

      // Step 7: Calculate actual cost
      const modelMetadata = availableModels.find((m) => m.modelKey === routingDecision.model)!;

      const actualCost = this.costCalculator.calculate({
        model: modelMetadata,
        tokensInput: providerResponse.tokensInput,
        tokensOutput: providerResponse.tokensOutput,
        tokensCacheWrite: providerResponse.tokensCacheWrite,
        tokensCacheRead: providerResponse.tokensCacheRead,
      });

      // Step 8: Build execution result
      const executionResult: ExecutionResult = {
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
    } catch (error: any) {
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
  async *generateStream(request: RoutingRequest): AsyncIterable<{
    text: string;
    isDone: boolean;
    metadata?: {
      provider: string;
      model: string;
      requestId: string;
    };
  }> {
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
  async healthCheck(): Promise<Record<string, { available: boolean; latencyMs?: number }>> {
    const results: Record<string, any> = {};

    for (const [key, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        results[key] = health;
      } catch (error: any) {
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
  private getAllModels(): ModelMetadata[] {
    const models: ModelMetadata[] = [];

    for (const provider of this.providers.values()) {
      models.push(...provider.getSupportedModels());
    }

    return models;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event system access
   */
  get events(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * Audit logs access
   */
  get audit(): AuditLogger {
    return this.auditLogger;
  }

  /**
   * Circuit breaker access (admin operations)
   */
  get circuits(): CircuitBreaker {
    return this.circuitBreaker;
  }
}
