/**
 * INTELLIGENCE GUARD
 *
 * Mechanical law enforcement: Operations without intelligence receipts CANNOT proceed.
 *
 * This guard wraps all Rob operations and validates intelligence before allowing execution.
 */
import { IntelligenceReceipt, IntelligenceViolationError } from './IntelligenceContract';
export interface GuardContext {
    sessionId: string;
    operation: string;
    receipts: IntelligenceReceipt[];
}
export interface GuardResult<T> {
    allowed: boolean;
    data?: T;
    error?: IntelligenceViolationError;
    violationReceipt?: any;
}
/**
 * MECHANICAL LAW: Intelligence Guard
 *
 * Before ANY build operation proceeds:
 * 1. Check required intelligence receipts exist
 * 2. Validate receipt quality
 * 3. Verify truth states
 * 4. Block if requirements not met
 */
export declare class IntelligenceGuard {
    /**
     * Guard a build operation - BLOCKS if intelligence requirements not met
     */
    static guard<T>(context: GuardContext, operation: () => Promise<T>): Promise<GuardResult<T>>;
    /**
     * Create a violation receipt when intelligence requirements not met
     *
     * This is the ONLY receipt allowed when operation is blocked
     */
    private static createViolationReceipt;
    /**
     * Check if an operation is title-only (FORBIDDEN)
     */
    static isTitleOnlyUpdate(operation: any): boolean;
    /**
     * Enforce: Title-only updates are FORBIDDEN
     */
    static blockTitleOnlyUpdate(sessionId: string, operation: string): never;
}
/**
 * TypeScript Decorator: @RequiresIntelligence
 *
 * Automatically enforce intelligence requirements on methods
 */
export declare function RequiresIntelligence(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
/**
 * Middleware: Express/Next.js Intelligence Enforcement
 */
export declare function intelligenceMiddleware(req: any, res: any, next: any): any;
//# sourceMappingURL=IntelligenceGuard.d.ts.map