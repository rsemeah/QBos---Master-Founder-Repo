"use strict";
/**
 * INTELLIGENCE GUARD
 *
 * Mechanical law enforcement: Operations without intelligence receipts CANNOT proceed.
 *
 * This guard wraps all Rob operations and validates intelligence before allowing execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceGuard = void 0;
exports.RequiresIntelligence = RequiresIntelligence;
exports.intelligenceMiddleware = intelligenceMiddleware;
const IntelligenceContract_1 = require("./IntelligenceContract");
/**
 * MECHANICAL LAW: Intelligence Guard
 *
 * Before ANY build operation proceeds:
 * 1. Check required intelligence receipts exist
 * 2. Validate receipt quality
 * 3. Verify truth states
 * 4. Block if requirements not met
 */
class IntelligenceGuard {
    /**
     * Guard a build operation - BLOCKS if intelligence requirements not met
     */
    static async guard(context, operation) {
        try {
            // Step 1: Validate required receipts exist
            (0, IntelligenceContract_1.validateIntelligenceReceipts)(context.receipts, context.operation, context.sessionId);
            // Step 2: Validate quality of each receipt
            const qualityIssues = [];
            for (const receipt of context.receipts) {
                const quality = (0, IntelligenceContract_1.validateIntelligenceQuality)(receipt);
                if (!quality.valid) {
                    qualityIssues.push(`${receipt.type}: ${quality.reason}`);
                }
            }
            if (qualityIssues.length > 0) {
                const error = new IntelligenceContract_1.IntelligenceViolationError(context.receipts.map((r) => r.type), context.operation, context.sessionId);
                error.message = `Intelligence quality violations: ${qualityIssues.join('; ')}`;
                return {
                    allowed: false,
                    error,
                    violationReceipt: this.createViolationReceipt(context, qualityIssues),
                };
            }
            // Step 3: Verify truth states
            const unverifiedReceipts = context.receipts.filter((receipt) => {
                const truthState = (0, IntelligenceContract_1.determineIntelligenceTruthState)(receipt, context.receipts);
                return truthState === 'Unknown';
            });
            if (unverifiedReceipts.length > 0) {
                const error = new IntelligenceContract_1.IntelligenceViolationError(unverifiedReceipts.map((r) => r.type), context.operation, context.sessionId);
                error.message = `Intelligence receipts in Unknown state: ${unverifiedReceipts.map((r) => r.type).join(', ')}`;
                return {
                    allowed: false,
                    error,
                    violationReceipt: this.createViolationReceipt(context, unverifiedReceipts.map((r) => `${r.type} is Unknown`)),
                };
            }
            // All checks passed - execute operation
            const data = await operation();
            return {
                allowed: true,
                data,
            };
        }
        catch (error) {
            if (error instanceof IntelligenceContract_1.IntelligenceViolationError) {
                return {
                    allowed: false,
                    error,
                    violationReceipt: this.createViolationReceipt(context, [error.message]),
                };
            }
            throw error; // Re-throw non-intelligence errors
        }
    }
    /**
     * Create a violation receipt when intelligence requirements not met
     *
     * This is the ONLY receipt allowed when operation is blocked
     */
    static createViolationReceipt(context, violations) {
        return {
            type: 'intelligence.violation',
            sessionId: context.sessionId,
            operation: context.operation,
            timestamp: new Date().toISOString(),
            details: {
                violations,
                requiredReceipts: IntelligenceContract_1.REQUIRED_INTELLIGENCE_RECEIPTS,
                receivedReceipts: context.receipts.map((r) => r.type),
                cause: 'BLOCKED',
                severity: 'HIGH',
            },
            truthState: 'Verified', // Ironically, violations are verified facts
        };
    }
    /**
     * Check if an operation is title-only (FORBIDDEN)
     */
    static isTitleOnlyUpdate(operation) {
        // Title-only updates have:
        // 1. app_name changed
        // 2. NO code generated
        // 3. NO preview created
        // 4. NO structure changes
        if (!operation.changes) {
            return false;
        }
        const hasOnlyTitleChange = operation.changes.app_name &&
            !operation.changes.code &&
            !operation.changes.preview &&
            !operation.changes.structure &&
            !operation.changes.dataModel;
        return hasOnlyTitleChange;
    }
    /**
     * Enforce: Title-only updates are FORBIDDEN
     */
    static blockTitleOnlyUpdate(sessionId, operation) {
        const error = new IntelligenceContract_1.IntelligenceViolationError(IntelligenceContract_1.REQUIRED_INTELLIGENCE_RECEIPTS, operation, sessionId);
        error.message = 'FORBIDDEN: Title-only updates violate intelligence requirement. Must emit idea.decomposed, concept.inferred, direction.recommended.';
        throw error;
    }
}
exports.IntelligenceGuard = IntelligenceGuard;
/**
 * TypeScript Decorator: @RequiresIntelligence
 *
 * Automatically enforce intelligence requirements on methods
 */
function RequiresIntelligence(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        const sessionId = args[0]?.sessionId || 'unknown';
        const operation = `${target.constructor.name}.${propertyKey}`;
        // Extract receipts from context (assumed to be in args)
        const receipts = args[0]?.intelligenceReceipts || [];
        const context = {
            sessionId,
            operation,
            receipts,
        };
        const result = await IntelligenceGuard.guard(context, async () => {
            return originalMethod.apply(this, args);
        });
        if (!result.allowed) {
            throw result.error;
        }
        return result.data;
    };
    return descriptor;
}
/**
 * Middleware: Express/Next.js Intelligence Enforcement
 */
function intelligenceMiddleware(req, res, next) {
    const sessionId = req.body.sessionId || req.query.sessionId;
    const operation = `${req.method} ${req.path}`;
    // Check if this is a build operation
    const isBuildOperation = req.path.includes('/build') ||
        req.path.includes('/chat') ||
        req.path.includes('/message');
    if (!isBuildOperation) {
        return next(); // Skip non-build operations
    }
    // Extract intelligence receipts from request
    const intelligenceReceipts = req.body.intelligenceReceipts || [];
    // Guard the operation
    IntelligenceGuard.guard({
        sessionId,
        operation,
        receipts: intelligenceReceipts,
    }, async () => {
        return new Promise((resolve) => {
            next();
            resolve(undefined);
        });
    }).then((result) => {
        if (!result.allowed) {
            res.status(403).json({
                error: 'Intelligence requirement violation',
                message: result.error?.message,
                violation: result.violationReceipt,
                required: IntelligenceContract_1.REQUIRED_INTELLIGENCE_RECEIPTS,
            });
        }
    });
}
//# sourceMappingURL=IntelligenceGuard.js.map