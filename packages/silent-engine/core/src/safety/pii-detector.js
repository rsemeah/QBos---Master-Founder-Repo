"use strict";
/**
 * SilentEngine™ - PII Detector
 *
 * Detects Personally Identifiable Information in text
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIIDetector = void 0;
class PIIDetector {
    /**
     * Detect PII in text
     */
    detect(text) {
        const types = [];
        let count = 0;
        // SSN
        if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
            types.push('ssn');
            count++;
        }
        // Credit card
        if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
            types.push('credit_card');
            count++;
        }
        // Email
        const emailMatches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
        if (emailMatches) {
            types.push('email');
            count += emailMatches.length;
        }
        // Phone (US format)
        const phoneMatches = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
        if (phoneMatches) {
            types.push('phone');
            count += phoneMatches.length;
        }
        return {
            found: types.length > 0,
            types,
            count,
        };
    }
}
exports.PIIDetector = PIIDetector;
//# sourceMappingURL=pii-detector.js.map