/**
 * INTELLIGENCE CONTRACT
 *
 * Constitutional requirement: Rob MUST demonstrate intelligence.
 * This contract defines the required receipts that prove intelligence.
 *
 * MECHANICAL LAW: Any operation missing these receipts MUST fail.
 */
export type IntelligenceReceiptType = 'idea.decomposed' | 'concept.inferred' | 'direction.recommended' | 'domain.risk_detected' | 'alternatives.proposed' | 'mechanics.identified' | 'preview.generated';
export type TruthState = 'Verified' | 'Unknown';
/**
 * Minimum required fields for an intelligence receipt
 */
export interface IntelligenceReceipt {
    type: IntelligenceReceiptType;
    sessionId: string;
    messageId: string;
    details: Record<string, any>;
    truthState: TruthState;
    timestamp: string;
}
/**
 * CONSTITUTIONAL REQUIREMENT: Idea Decomposition
 *
 * When a user provides ANY build request, Rob MUST:
 * 1. Break it into interpretations
 * 2. Identify domain
 * 3. Detect risks
 * 4. Recommend direction
 *
 * Failure to emit these receipts = BLOCKED state
 */
export interface IdeaDecompositionReceipt extends IntelligenceReceipt {
    type: 'idea.decomposed';
    details: {
        originalPrompt: string;
        interpretations: Array<{
            name: string;
            description: string;
            feasibility: 'high' | 'medium' | 'low';
            complexity: 'simple' | 'moderate' | 'complex';
        }>;
        detectedDomain: string;
        targetAudience: string;
    };
}
/**
 * CONSTITUTIONAL REQUIREMENT: Concept Inference
 *
 * Rob MUST infer the deeper concept behind the request:
 * - Core mechanics
 * - Key features
 * - Technical architecture
 */
export interface ConceptInferenceReceipt extends IntelligenceReceipt {
    type: 'concept.inferred';
    details: {
        coreMechanics: string[];
        essentialFeatures: string[];
        technicalApproach: string;
        dataModel: string;
    };
}
/**
 * CONSTITUTIONAL REQUIREMENT: Direction Recommendation
 *
 * Rob MUST recommend a specific direction with reasoning
 */
export interface DirectionRecommendationReceipt extends IntelligenceReceipt {
    type: 'direction.recommended';
    details: {
        recommendedInterpretation: string;
        reasoning: string;
        safetyLevel: 'safe' | 'caution' | 'risky';
        estimatedComplexity: 'simple' | 'moderate' | 'complex';
        nextSteps: string[];
    };
}
/**
 * CONSTITUTIONAL REQUIREMENT: Domain Risk Detection
 *
 * Rob MUST detect and report risks (IP, legal, technical)
 */
export interface DomainRiskReceipt extends IntelligenceReceipt {
    type: 'domain.risk_detected';
    details: {
        riskType: 'ip_violation' | 'legal' | 'technical' | 'ethical' | 'none';
        severity: 'high' | 'medium' | 'low' | 'none';
        description: string;
        requiresConsent: boolean;
        safeAlternative?: string;
    };
}
/**
 * CONSTITUTIONAL REQUIREMENT: Alternatives Proposal
 *
 * When risks detected, Rob MUST propose safe alternatives
 */
export interface AlternativesProposalReceipt extends IntelligenceReceipt {
    type: 'alternatives.proposed';
    details: {
        originalConcept: string;
        alternatives: Array<{
            name: string;
            description: string;
            safetyLevel: 'safe' | 'caution';
            preservesIntent: boolean;
        }>;
        recommendation: string;
    };
}
/**
 * CONSTITUTIONAL REQUIREMENT: Preview Generation
 *
 * Rob MUST generate a living preview (React component)
 */
export interface PreviewGenerationReceipt extends IntelligenceReceipt {
    type: 'preview.generated';
    details: {
        componentName: string;
        framework: 'react' | 'vue' | 'svelte';
        linesOfCode: number;
        interactivityLevel: 'static' | 'interactive' | 'dynamic';
        renderSuccess: boolean;
        previewUrl?: string;
    };
}
/**
 * INTELLIGENCE VIOLATION ERROR
 *
 * Thrown when required intelligence receipts are missing
 */
export declare class IntelligenceViolationError extends Error {
    readonly missingReceipts: IntelligenceReceiptType[];
    readonly operation: string;
    readonly sessionId: string;
    constructor(missingReceipts: IntelligenceReceiptType[], operation: string, sessionId: string);
}
/**
 * MINIMUM INTELLIGENCE REQUIREMENTS
 *
 * Every build request MUST emit AT LEAST these receipts
 */
export declare const REQUIRED_INTELLIGENCE_RECEIPTS: IntelligenceReceiptType[];
/**
 * CONDITIONAL REQUIREMENTS
 *
 * Additional receipts required based on context
 */
export declare const CONDITIONAL_INTELLIGENCE_RECEIPTS: {
    readonly hasRisk: readonly ["domain.risk_detected", "alternatives.proposed"];
    readonly needsPreview: readonly ["preview.generated"];
};
/**
 * Validate that all required intelligence receipts are present
 */
export declare function validateIntelligenceReceipts(receipts: IntelligenceReceipt[], operation: string, sessionId: string): void;
/**
 * Check if intelligence receipts demonstrate actual intelligence
 *
 * Not enough to emit receipts - they must contain meaningful data
 */
export declare function validateIntelligenceQuality(receipt: IntelligenceReceipt): {
    valid: boolean;
    reason?: string;
};
/**
 * TRUTH STATE RULES
 *
 * Intelligence receipts can only be Verified if:
 * 1. All required fields present
 * 2. Quality validation passes
 * 3. No contradictions with other receipts
 */
export declare function determineIntelligenceTruthState(receipt: IntelligenceReceipt, allReceipts: IntelligenceReceipt[]): TruthState;
//# sourceMappingURL=IntelligenceContract.d.ts.map