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
export declare class ConstraintEvaluator {
    /**
     * Evaluate if a model satisfies request constraints
     */
    evaluate(params: {
        model: ModelMetadata;
        estimatedTokensInput: number;
        estimatedTokensOutput: number;
        maxCost?: number;
        maxLatency?: number;
    }): ConstraintEvaluation;
    /**
     * Estimate cost for a request
     */
    private estimateCost;
    /**
     * Estimate token count (rough heuristic: 1 token ≈ 4 chars)
     */
    estimateTokens(text: string): number;
}
//# sourceMappingURL=constraint-evaluator.d.ts.map