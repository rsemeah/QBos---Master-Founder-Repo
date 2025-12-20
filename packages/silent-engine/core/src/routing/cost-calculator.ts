/**
 * SilentEngine™ - Cost Calculator
 *
 * Calculates actual costs from token usage
 */

import { ModelMetadata } from '../types';

export class CostCalculator {
  /**
   * Calculate actual cost from usage
   */
  calculate(params: {
    model: ModelMetadata;
    tokensInput: number;
    tokensOutput: number;
    tokensCacheWrite?: number;
    tokensCacheRead?: number;
  }): number {
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
