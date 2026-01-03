/**
 * IDEA DECOMPOSER
 *
 * Generates intelligence receipts from user prompts.
 * This is the engine that demonstrates Rob's intelligence.
 *
 * RULE-BASED: Uses pattern matching and domain knowledge (deterministic)
 * AI-OPTIONAL: Can be enhanced with LLM calls, but works without them
 */
import type { IntelligenceReceipt } from './IntelligenceContract';
export interface DecompositionResult {
    receipts: IntelligenceReceipt[];
    summary: {
        domain: string;
        interpretations: number;
        hasRisks: boolean;
        recommendedPath: string;
    };
}
/**
 * Idea Decomposer - Rule-based intelligence
 */
export declare class IdeaDecomposer {
    /**
     * Decompose a user prompt into intelligence receipts
     *
     * ALWAYS emits minimum 3 receipts:
     * 1. idea.decomposed
     * 2. concept.inferred
     * 3. direction.recommended
     *
     * May emit additional receipts:
     * 4. domain.risk_detected (if risks found)
     * 5. alternatives.proposed (if risks require alternatives)
     */
    decompose(sessionId: string, messageId: string, userPrompt: string): Promise<DecompositionResult>;
    /**
     * Generic decomposition for unknown patterns
     */
    private genericDecomposition;
    /**
     * Infer target audience from prompt and domain
     */
    private inferAudience;
    /**
     * Infer technical approach based on domain
     */
    private inferTechnicalApproach;
    /**
     * Infer data model from core mechanics
     */
    private inferDataModel;
    /**
     * Generate next steps based on domain and interpretation
     */
    private generateNextSteps;
}
//# sourceMappingURL=IdeaDecomposer.d.ts.map