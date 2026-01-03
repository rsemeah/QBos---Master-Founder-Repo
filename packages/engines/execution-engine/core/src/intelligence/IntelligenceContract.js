"use strict";
/**
 * INTELLIGENCE CONTRACT
 *
 * Constitutional requirement: Rob MUST demonstrate intelligence.
 * This contract defines the required receipts that prove intelligence.
 *
 * MECHANICAL LAW: Any operation missing these receipts MUST fail.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONDITIONAL_INTELLIGENCE_RECEIPTS = exports.REQUIRED_INTELLIGENCE_RECEIPTS = exports.IntelligenceViolationError = void 0;
exports.validateIntelligenceReceipts = validateIntelligenceReceipts;
exports.validateIntelligenceQuality = validateIntelligenceQuality;
exports.determineIntelligenceTruthState = determineIntelligenceTruthState;
/**
 * INTELLIGENCE VIOLATION ERROR
 *
 * Thrown when required intelligence receipts are missing
 */
class IntelligenceViolationError extends Error {
    missingReceipts;
    operation;
    sessionId;
    constructor(missingReceipts, operation, sessionId) {
        super(`Intelligence violation in operation "${operation}": Missing required receipts: ${missingReceipts.join(', ')}`);
        this.missingReceipts = missingReceipts;
        this.operation = operation;
        this.sessionId = sessionId;
        this.name = 'IntelligenceViolationError';
    }
}
exports.IntelligenceViolationError = IntelligenceViolationError;
/**
 * MINIMUM INTELLIGENCE REQUIREMENTS
 *
 * Every build request MUST emit AT LEAST these receipts
 */
exports.REQUIRED_INTELLIGENCE_RECEIPTS = [
    'idea.decomposed',
    'concept.inferred',
    'direction.recommended',
];
/**
 * CONDITIONAL REQUIREMENTS
 *
 * Additional receipts required based on context
 */
exports.CONDITIONAL_INTELLIGENCE_RECEIPTS = {
    hasRisk: ['domain.risk_detected', 'alternatives.proposed'],
    needsPreview: ['preview.generated'],
};
/**
 * Validate that all required intelligence receipts are present
 */
function validateIntelligenceReceipts(receipts, operation, sessionId) {
    const receiptTypes = new Set(receipts.map((r) => r.type));
    const missing = [];
    for (const required of exports.REQUIRED_INTELLIGENCE_RECEIPTS) {
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
function validateIntelligenceQuality(receipt) {
    switch (receipt.type) {
        case 'idea.decomposed':
            const ideaReceipt = receipt;
            if (ideaReceipt.details.interpretations.length === 0) {
                return { valid: false, reason: 'No interpretations provided' };
            }
            if (!ideaReceipt.details.detectedDomain) {
                return { valid: false, reason: 'Domain not detected' };
            }
            break;
        case 'concept.inferred':
            const conceptReceipt = receipt;
            if (conceptReceipt.details.coreMechanics.length === 0) {
                return { valid: false, reason: 'No core mechanics identified' };
            }
            if (conceptReceipt.details.essentialFeatures.length === 0) {
                return { valid: false, reason: 'No essential features identified' };
            }
            break;
        case 'direction.recommended':
            const directionReceipt = receipt;
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
            const riskReceipt = receipt;
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
function determineIntelligenceTruthState(receipt, allReceipts) {
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
//# sourceMappingURL=IntelligenceContract.js.map