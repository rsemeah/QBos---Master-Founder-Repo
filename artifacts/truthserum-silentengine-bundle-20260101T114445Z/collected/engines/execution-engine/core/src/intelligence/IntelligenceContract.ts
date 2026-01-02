/**
 * INTELLIGENCE CONTRACT
 * 
 * Constitutional requirement: Rob MUST demonstrate intelligence.
 * This contract defines the required receipts that prove intelligence.
 * 
 * MECHANICAL LAW: Any operation missing these receipts MUST fail.
 */

export type IntelligenceReceiptType =
  | 'idea.decomposed'
  | 'concept.inferred'
  | 'direction.recommended'
  | 'domain.risk_detected'
  | 'alternatives.proposed'
  | 'mechanics.identified'
  | 'preview.generated';

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
    detectedDomain: string; // e.g., 'gaming', 'fintech', 'health'
    targetAudience: string; // e.g., 'kids', 'collectors', 'professionals'
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
    coreMechanics: string[]; // e.g., ['collection', 'battle', 'trading']
    essentialFeatures: string[]; // e.g., ['stats', 'evolution', 'inventory']
    technicalApproach: string; // e.g., 'React SPA with state management'
    dataModel: string; // e.g., 'entities with relationships'
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
export class IntelligenceViolationError extends Error {
  constructor(
    public readonly missingReceipts: IntelligenceReceiptType[],
    public readonly operation: string,
    public readonly sessionId: string
  ) {
    super(
      `Intelligence violation in operation "${operation}": Missing required receipts: ${missingReceipts.join(', ')}`
    );
    this.name = 'IntelligenceViolationError';
  }
}

/**
 * MINIMUM INTELLIGENCE REQUIREMENTS
 * 
 * Every build request MUST emit AT LEAST these receipts
 */
export const REQUIRED_INTELLIGENCE_RECEIPTS: IntelligenceReceiptType[] = [
  'idea.decomposed',
  'concept.inferred',
  'direction.recommended',
];

/**
 * CONDITIONAL REQUIREMENTS
 * 
 * Additional receipts required based on context
 */
export const CONDITIONAL_INTELLIGENCE_RECEIPTS = {
  hasRisk: ['domain.risk_detected', 'alternatives.proposed'],
  needsPreview: ['preview.generated'],
} as const;

/**
 * Validate that all required intelligence receipts are present
 */
export function validateIntelligenceReceipts(
  receipts: IntelligenceReceipt[],
  operation: string,
  sessionId: string
): void {
  const receiptTypes = new Set(receipts.map((r) => r.type));
  const missing: IntelligenceReceiptType[] = [];

  for (const required of REQUIRED_INTELLIGENCE_RECEIPTS) {
    if (!receiptTypes.has(required)) {
      missing.push(required);
    }
  }

  if (missing.length > 0) {
    throw new IntelligenceViolationError(missing, operation, sessionId);
  }
}

/**
 * Check if intelligence receipts demonstrate actual intelligence
 * 
 * Not enough to emit receipts - they must contain meaningful data
 */
export function validateIntelligenceQuality(
  receipt: IntelligenceReceipt
): { valid: boolean; reason?: string } {
  switch (receipt.type) {
    case 'idea.decomposed':
      const ideaReceipt = receipt as IdeaDecompositionReceipt;
      if (ideaReceipt.details.interpretations.length === 0) {
        return { valid: false, reason: 'No interpretations provided' };
      }
      if (!ideaReceipt.details.detectedDomain) {
        return { valid: false, reason: 'Domain not detected' };
      }
      break;

    case 'concept.inferred':
      const conceptReceipt = receipt as ConceptInferenceReceipt;
      if (conceptReceipt.details.coreMechanics.length === 0) {
        return { valid: false, reason: 'No core mechanics identified' };
      }
      if (conceptReceipt.details.essentialFeatures.length === 0) {
        return { valid: false, reason: 'No essential features identified' };
      }
      break;

    case 'direction.recommended':
      const directionReceipt = receipt as DirectionRecommendationReceipt;
      if (!directionReceipt.details.recommendedInterpretation) {
        return { valid: false, reason: 'No interpretation recommended' };
      }
      if (!directionReceipt.details.reasoning) {
        return { valid: false, reason: 'No reasoning provided' };
      }
      if (directionReceipt.details.nextSteps.length === 0) {
        return { valid: false, reason: 'No next steps provided' };
      }
      break;

    case 'domain.risk_detected':
      const riskReceipt = receipt as DomainRiskReceipt;
      if (!riskReceipt.details.description) {
        return { valid: false, reason: 'Risk not described' };
      }
      if (riskReceipt.details.requiresConsent && !riskReceipt.details.safeAlternative) {
        return { valid: false, reason: 'High-risk operation without safe alternative' };
      }
      break;
  }

  return { valid: true };
}

/**
 * TRUTH STATE RULES
 * 
 * Intelligence receipts can only be Verified if:
 * 1. All required fields present
 * 2. Quality validation passes
 * 3. No contradictions with other receipts
 */
export function determineIntelligenceTruthState(
  receipt: IntelligenceReceipt,
  allReceipts: IntelligenceReceipt[]
): TruthState {
  const qualityCheck = validateIntelligenceQuality(receipt);
  if (!qualityCheck.valid) {
    return 'Unknown';
  }

  // Check for contradictions
  // e.g., direction recommended without idea decomposed
  if (receipt.type === 'direction.recommended') {
    const hasDecomposition = allReceipts.some((r) => r.type === 'idea.decomposed');
    if (!hasDecomposition) {
      return 'Unknown';
    }
  }

  return 'Verified';
}
