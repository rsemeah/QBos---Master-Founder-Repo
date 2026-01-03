/**
 * SilentEngine™ - PII Detector
 *
 * Detects Personally Identifiable Information in text
 */
export interface PIIDetectionResult {
    found: boolean;
    types: string[];
    count: number;
}
export declare class PIIDetector {
    /**
     * Detect PII in text
     */
    detect(text: string): PIIDetectionResult;
}
//# sourceMappingURL=pii-detector.d.ts.map