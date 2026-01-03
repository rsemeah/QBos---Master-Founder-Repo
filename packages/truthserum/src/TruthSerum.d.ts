/**
 * TruthSerum - The canonical proof verification engine
 * NEVER upgrades Unknown to Verified without receipts
 */
import { TruthState, TruthVerdict, TruthClaim, Receipt, BuildIntent, IntentEvaluation } from "./types";
export declare class TruthSerum {
    /**
     * Evaluate an intent against available receipts
     * Returns Verified ONLY if all required proofs exist
     */
    static evaluateIntent(intent: BuildIntent, receipts: Receipt[]): IntentEvaluation;
    /**
     * Sanitize claims by rewriting unproven success language
     * Forbidden words unless backed by receipts:
     * - deployed, live, published, ready, working, completed, fixed, verified
     */
    static sanitizeClaims(draftText: string, receipts: Receipt[], overallState: TruthState): TruthVerdict;
    /**
     * Compute overall readiness state from multiple intent evaluations
     */
    static computeOverallState(evaluations: IntentEvaluation[]): TruthState;
    /**
     * Verify a claim with explicit proof requirements
     */
    static verifyClaim(claim: TruthClaim, receipts: Receipt[]): TruthVerdict;
}
//# sourceMappingURL=TruthSerum.d.ts.map