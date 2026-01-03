/**
 * SilentEngine™ - Safety Classifier
 *
 * Lightweight safety checks for requests
 */
import { Message } from '../types';
export interface SafetyCheckResult {
    safe: boolean;
    flags: string[];
    riskLevel: 'low' | 'medium' | 'high';
    shouldBlock: boolean;
    reason?: string;
}
export declare class SafetyClassifier {
    /**
     * Perform lightweight safety check
     * Deep checks delegated to SafetyEngine
     */
    check(params: {
        messages: Message[];
        requireSafetyCheck: boolean;
    }): SafetyCheckResult;
    /**
     * Check for PII patterns
     */
    private containsPII;
    /**
     * Check for jailbreak patterns
     */
    private containsJailbreakPatterns;
    /**
     * Check for high-risk topics
     */
    private containsHighRiskTopics;
}
//# sourceMappingURL=safety-classifier.d.ts.map