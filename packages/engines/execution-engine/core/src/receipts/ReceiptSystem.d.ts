/**
 * ReceiptSystem™ - TruthSerum-Grade Receipt Management
 *
 * TRUTH REQUIREMENTS:
 * - Every engine invocation produces a receipt
 * - Every receipt is immutable and timestamped
 * - Receipts prove coordination, not just activity
 */
export type ReceiptActor = 'user' | 'rob' | string;
export type ReceiptOutcome = 'success' | 'blocked' | 'error' | 'unknown';
export type TruthState = 'Verified' | 'Unknown';
export interface Receipt {
    receipt_id: string;
    session_id: string;
    timestamp: string;
    actor: ReceiptActor;
    action_type: string;
    outcome: ReceiptOutcome;
    evidence_refs: string[];
    truth_state: TruthState;
    metadata?: Record<string, unknown>;
    parent_receipt_id?: string;
}
export interface EngineInvocationReceipt extends Receipt {
    action_type: 'engine_invoked';
    metadata: {
        engine_name: string;
        input_hash?: string;
        output_hash?: string;
        duration_ms: number;
    };
}
export interface GateCheckReceipt extends Receipt {
    action_type: 'gate_checked';
    metadata: {
        gate_type: 'config' | 'paywall' | 'charter';
        gate_key: string;
        allowed: boolean;
        reason?: string;
    };
}
export declare class ReceiptSystem {
    private receipts;
    private receiptsBySession;
    /**
     * Emit a receipt (immutable once created)
     */
    emit(receipt: Omit<Receipt, 'receipt_id' | 'timestamp'>): Receipt;
    /**
     * Emit session created receipt
     */
    emitSessionCreated(sessionId: string, appName: string, goals: string[]): Receipt;
    /**
     * Emit user input received
     */
    emitUserInput(sessionId: string, input: unknown): Receipt;
    /**
     * Emit engine invocation
     */
    emitEngineInvoked(sessionId: string, engineName: string, durationMs: number, outcome: ReceiptOutcome, parentReceiptId?: string): EngineInvocationReceipt;
    /**
     * Emit gate check (config/paywall/charter)
     */
    emitGateCheck(sessionId: string, gateType: 'config' | 'paywall' | 'charter', gateKey: string, allowed: boolean, reason?: string, parentReceiptId?: string): GateCheckReceipt;
    /**
     * Emit action executed
     */
    emitActionExecuted(sessionId: string, actor: ReceiptActor, action: string, outcome: ReceiptOutcome, evidenceRefs: string[], parentReceiptId?: string): Receipt;
    /**
     * Get all receipts for a session
     */
    getReceiptsForSession(sessionId: string): Receipt[];
    /**
     * Get receipt by ID
     */
    getReceipt(receiptId: string): Receipt | undefined;
    /**
     * Get receipt chain (follow parent_receipt_id)
     */
    getReceiptChain(receiptId: string): Receipt[];
    /**
     * Validate session receipts for completeness
     */
    validateSession(sessionId: string): {
        valid: boolean;
        issues: string[];
        receipts: Receipt[];
    };
    private generateReceiptId;
}
//# sourceMappingURL=ReceiptSystem.d.ts.map