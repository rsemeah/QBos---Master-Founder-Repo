/**
 * SilentEngine™ - Capability Matcher
 *
 * Scores models based on capability requirements
 */

import { ModelMetadata, ProviderCapabilities } from '../types';

export interface CapabilityMatchResult {
  modelKey: string;
  provider: string;
  score: number; // 0.0 to 1.0
  matched: string[];
  missing: string[];
}

export class CapabilityMatcher {
  /**
   * Score models based on capability match
   * Returns sorted list (highest score first)
   */
  scoreModels(params: {
    models: ModelMetadata[];
    requiredCapabilities: string[];
    preferredCapabilities: string[];
  }): CapabilityMatchResult[] {
    const results: CapabilityMatchResult[] = [];

    for (const model of params.models) {
      if (!model.enabled) continue;

      const capabilities = this.extractCapabilityList(model.capabilities);

      // Check required capabilities (hard requirement)
      const missingRequired = params.requiredCapabilities.filter(
        (cap) => !capabilities.includes(cap)
      );

      if (missingRequired.length > 0) {
        // Skip models that don't meet required capabilities
        continue;
      }

      // Score based on preferred capabilities
      const matchedPreferred = params.preferredCapabilities.filter((cap) =>
        capabilities.includes(cap)
      );

      // Score calculation:
      // 1.0 = all preferred capabilities matched
      // 0.5 = half matched
      // 0.0 = none matched (but required are satisfied)
      const score =
        params.preferredCapabilities.length > 0
          ? matchedPreferred.length / params.preferredCapabilities.length
          : 1.0; // If no preferences, all qualifying models get 1.0

      results.push({
        modelKey: model.modelKey,
        provider: model.providerKey,
        score,
        matched: matchedPreferred,
        missing: params.preferredCapabilities.filter((cap) => !capabilities.includes(cap)),
      });
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Convert capability object to string array
   */
  private extractCapabilityList(capabilities: ProviderCapabilities): string[] {
    const caps: string[] = [];

    if (capabilities.longContext) caps.push('long_context');
    if (capabilities.toolUse) caps.push('tool_use');
    if (capabilities.vision) caps.push('vision');
    if (capabilities.streaming) caps.push('streaming');
    if (capabilities.codeGeneration) caps.push('code_generation');
    if (capabilities.strongReasoning) caps.push('strong_reasoning');
    if (capabilities.highQuality) caps.push('high_quality');
    if (capabilities.complexTasks) caps.push('complex_tasks');
    if (capabilities.lowCost) caps.push('low_cost');
    if (capabilities.fastLatency) caps.push('fast_latency');

    return caps;
  }
}
