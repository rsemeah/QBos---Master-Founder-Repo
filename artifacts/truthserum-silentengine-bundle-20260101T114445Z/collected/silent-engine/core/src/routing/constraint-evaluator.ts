/**
 * SilentEngine™ - Constraint Evaluator
 *
 * Evaluates if models satisfy cost and latency constraints
 */

import { ModelMetadata } from '../types';

export interface ConstraintEvaluation {
  satisfied: boolean;
  violations: string[];
  estimatedCost?: number;
  estimatedLatency?: number;
}

export class ConstraintEvaluator {
  /**
   * Evaluate if a model satisfies request constraints
   */
  evaluate(params: {
    model: ModelMetadata;
    estimatedTokensInput: number;
    estimatedTokensOutput: number;
    maxCost?: number;
    maxLatency?: number;
  }): ConstraintEvaluation {
    const violations: string[] = [];

    // Cost constraint
    let estimatedCost = 0;
    if (params.maxCost !== undefined) {
      estimatedCost = this.estimateCost({
        model: params.model,
        tokensInput: params.estimatedTokensInput,
        tokensOutput: params.estimatedTokensOutput,
      });

      if (estimatedCost > params.maxCost) {
        violations.push(`cost_exceeded: ${estimatedCost.toFixed(4)} > ${params.maxCost}`);
      }
    }

    // Latency constraint
    let estimatedLatency = 0;
    if (params.maxLatency !== undefined) {
      estimatedLatency = params.model.avgLatencyMs || 1000; // Default 1s if unknown

      if (estimatedLatency > params.maxLatency) {
        violations.push(`latency_exceeded: ${estimatedLatency}ms > ${params.maxLatency}ms`);
      }
    }

    return {
      satisfied: violations.length === 0,
      violations,
      estimatedCost,
      estimatedLatency,
    };
  }

  /**
   * Estimate cost for a request
   */
  private estimateCost(params: {
    model: ModelMetadata;
    tokensInput: number;
    tokensOutput: number;
  }): number {
    const costInput = (params.tokensInput / 1_000_000) * params.model.costInputPerMTok;
    const costOutput = (params.tokensOutput / 1_000_000) * params.model.costOutputPerMTok;
    return costInput + costOutput;
  }

  /**
   * Estimate token count (rough heuristic: 1 token ≈ 4 chars)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
