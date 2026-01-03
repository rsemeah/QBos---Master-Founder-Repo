/**
 * PREVIEW GENERATOR
 *
 * Generates working React components based on intelligence receipts.
 * Target: 10-second turnaround from prompt to interactive preview.
 *
 * MECHANICAL LAW: Every build MUST produce a living preview.
 */
import type { PreviewGenerationReceipt, IntelligenceReceipt } from './IntelligenceContract';
export interface PreviewResult {
    code: string;
    componentName: string;
    framework: 'react';
    linesOfCode: number;
    interactivityLevel: 'static' | 'interactive' | 'dynamic';
    renderSuccess: boolean;
    receipt: PreviewGenerationReceipt;
}
/**
 * Preview Generator - Creates working React components
 */
export declare class PreviewGenerator {
    /**
     * Generate preview component based on intelligence receipts
     */
    generate(sessionId: string, messageId: string, intelligenceReceipts: IntelligenceReceipt[]): Promise<PreviewResult>;
    /**
     * Generate minimal preview if full generation fails
     */
    generateFallback(sessionId: string, messageId: string, error: string): PreviewResult;
}
//# sourceMappingURL=PreviewGenerator.d.ts.map