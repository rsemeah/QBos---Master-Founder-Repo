/**
 * TruthSerumValidator™ - Investor-Grade Proof Mechanism
 *
 * VALIDATES:
 * - Engine awareness (who talks to who)
 * - Coordination proofs (receipts)
 * - Ordering enforcement
 * - No false claims
 */
import type { Receipt } from './ReceiptSystem';
export interface EngineInteraction {
    from: string;
    to: string;
    evidence: string;
    verified: boolean;
}
export interface EngineAwarenessMatrix {
    engines: string[];
    interactions: EngineInteraction[];
}
export interface TruthSerumReport {
    sessionId: string;
    valid: boolean;
    engineAwarenessMatrix: EngineAwarenessMatrix;
    orderingViolations: string[];
    missingReceipts: string[];
    unverifiedClaims: string[];
    summary: {
        enginesInvoked: string[];
        gatesChecked: string[];
        totalReceipts: number;
        verifiedReceipts: number;
        unknownReceipts: number;
    };
}
export declare class TruthSerumValidator {
    /**
     * Audit a session's receipts for TruthSerum compliance
     */
    validate(sessionId: string, receipts: Receipt[]): TruthSerumReport;
    /**
     * Validate canonical AI flow ordering:
     * 1. Identity
     * 2. Charter (consent)
     * 3. Config (gate)
     * 4. Paywall (entitlement)
     * 5. SilentEngine (AI)
     */
    private validateAIFlowOrdering;
    private extractEngine;
    /**
     * Generate human-readable report
     */
    generateReport(report: TruthSerumReport): string;
}
//# sourceMappingURL=TruthSerumValidator.d.ts.map