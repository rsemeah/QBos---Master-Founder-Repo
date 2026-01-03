"use strict";
/**
 * SilentEngine™ - Cost Calculator
 *
 * Calculates actual costs from token usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostCalculator = void 0;
class CostCalculator {
    /**
     * Calculate actual cost from usage
     */
    calculate(params) {
        const costInput = (params.tokensInput / 1_000_000) * params.model.costInputPerMTok;
        const costOutput = (params.tokensOutput / 1_000_000) * params.model.costOutputPerMTok;
        const costCacheWrite = params.tokensCacheWrite
            ? (params.tokensCacheWrite / 1_000_000) * (params.model.costCacheWritePerMTok || 0)
            : 0;
        const costCacheRead = params.tokensCacheRead
            ? (params.tokensCacheRead / 1_000_000) * (params.model.costCacheReadPerMTok || 0)
            : 0;
        return costInput + costOutput + costCacheWrite + costCacheRead;
    }
}
exports.CostCalculator = CostCalculator;
//# sourceMappingURL=cost-calculator.js.map