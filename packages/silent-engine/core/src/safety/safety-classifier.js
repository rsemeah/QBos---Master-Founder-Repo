"use strict";
/**
 * SilentEngine™ - Safety Classifier
 *
 * Lightweight safety checks for requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyClassifier = void 0;
class SafetyClassifier {
    /**
     * Perform lightweight safety check
     * Deep checks delegated to SafetyEngine
     */
    check(params) {
        const flags = [];
        let riskLevel = 'low';
        const combinedText = params.messages
            .map((m) => m.content)
            .join(' ')
            .toLowerCase();
        // PII detection (basic regex)
        if (this.containsPII(combinedText)) {
            flags.push('potential_pii');
            riskLevel = 'medium';
        }
        // Jailbreak patterns
        if (this.containsJailbreakPatterns(combinedText)) {
            flags.push('jailbreak_attempt');
            riskLevel = 'high';
        }
        // High-risk topics
        if (this.containsHighRiskTopics(combinedText)) {
            flags.push('high_risk_topic');
            riskLevel = 'high';
        }
        // Excessive length (potential DoS)
        if (combinedText.length > 100000) {
            // 100k chars
            flags.push('excessive_length');
            riskLevel = 'medium';
        }
        const shouldBlock = riskLevel === 'high' && params.requireSafetyCheck;
        return {
            safe: !shouldBlock,
            flags,
            riskLevel,
            shouldBlock,
            reason: shouldBlock ? 'Safety check failed: ' + flags.join(', ') : undefined,
        };
    }
    /**
     * Check for PII patterns
     */
    containsPII(text) {
        // SSN pattern
        const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
        // Credit card pattern
        const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
        // Email (basic)
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        return ssnPattern.test(text) || ccPattern.test(text) || emailPattern.test(text);
    }
    /**
     * Check for jailbreak patterns
     */
    containsJailbreakPatterns(text) {
        const jailbreakKeywords = [
            'ignore previous instructions',
            'ignore all previous',
            'disregard previous',
            'forget everything',
            'new instructions',
            'system prompt',
            'you are now',
            'roleplay as',
        ];
        return jailbreakKeywords.some((keyword) => text.includes(keyword));
    }
    /**
     * Check for high-risk topics
     */
    containsHighRiskTopics(text) {
        const highRiskKeywords = [
            'how to make a bomb',
            'create malware',
            'hack into',
            'steal identity',
            'credit card fraud',
            'self harm',
            'suicide method',
        ];
        return highRiskKeywords.some((keyword) => text.includes(keyword));
    }
}
exports.SafetyClassifier = SafetyClassifier;
//# sourceMappingURL=safety-classifier.js.map