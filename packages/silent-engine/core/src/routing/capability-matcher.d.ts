/**
 * SilentEngine™ - Capability Matcher
 *
 * Scores models based on capability requirements
 */
import { ModelMetadata } from '../types';
export interface CapabilityMatchResult {
    modelKey: string;
    provider: string;
    score: number;
    matched: string[];
    missing: string[];
}
export declare class CapabilityMatcher {
    /**
     * Score models based on capability match
     * Returns sorted list (highest score first)
     */
    scoreModels(params: {
        models: ModelMetadata[];
        requiredCapabilities: string[];
        preferredCapabilities: string[];
    }): CapabilityMatchResult[];
    /**
     * Convert capability object to string array
     */
    private extractCapabilityList;
}
//# sourceMappingURL=capability-matcher.d.ts.map