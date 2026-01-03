/**
 * SilentEngine™ - Cost Calculator
 *
 * Calculates actual costs from token usage
 */
import { ModelMetadata } from '../types';
export declare class CostCalculator {
    /**
     * Calculate actual cost from usage
     */
    calculate(params: {
        model: ModelMetadata;
        tokensInput: number;
        tokensOutput: number;
        tokensCacheWrite?: number;
        tokensCacheRead?: number;
    }): number;
}
//# sourceMappingURL=cost-calculator.d.ts.map