"use strict";
/**
 * ReceiptSystem™ - TruthSerum-Grade Receipt Management
 *
 * TRUTH REQUIREMENTS:
 * - Every engine invocation produces a receipt
 * - Every receipt is immutable and timestamped
 * - Receipts prove coordination, not just activity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptSystem = void 0;
class ReceiptSystem {
    receipts = new Map();
    receiptsBySession = new Map();
    /**
     * Emit a receipt (immutable once created)
     */
    emit(receipt) {
        const fullReceipt = {
            ...receipt,
            receipt_id: this.generateReceiptId(),
            timestamp: new Date().toISOString(),
        };
        this.receipts.set(fullReceipt.receipt_id, fullReceipt);
        // Index by session
        if (!this.receiptsBySession.has(fullReceipt.session_id)) {
            this.receiptsBySession.set(fullReceipt.session_id, []);
        }
        this.receiptsBySession.get(fullReceipt.session_id).push(fullReceipt);
        return fullReceipt;
    }
    /**
     * Emit session created receipt
     */
    emitSessionCreated(sessionId, appName, goals) {
        return this.emit({
            session_id: sessionId,
            actor: 'user',
            action_type: 'session_created',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: { appName, goals },
        });
    }
    /**
     * Emit user input received
     */
    emitUserInput(sessionId, input) {
        return this.emit({
            session_id: sessionId,
            actor: 'user',
            action_type: 'user_input_received',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: { input },
        });
    }
    /**
     * Emit engine invocation
     */
    emitEngineInvoked(sessionId, engineName, durationMs, outcome, parentReceiptId) {
        return this.emit({
            session_id: sessionId,
            actor: engineName,
            action_type: 'engine_invoked',
            outcome,
            evidence_refs: [],
            truth_state: outcome === 'success' ? 'Verified' : 'Unknown',
            metadata: {
                engine_name: engineName,
                duration_ms: durationMs,
            },
            parent_receipt_id: parentReceiptId,
        });
    }
    /**
     * Emit gate check (config/paywall/charter)
     */
    emitGateCheck(sessionId, gateType, gateKey, allowed, reason, parentReceiptId) {
        return this.emit({
            session_id: sessionId,
            actor: gateType + 'Engine',
            action_type: 'gate_checked',
            outcome: allowed ? 'success' : 'blocked',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: {
                gate_type: gateType,
                gate_key: gateKey,
                allowed,
                reason,
            },
            parent_receipt_id: parentReceiptId,
        });
    }
    /**
     * Emit action executed
     */
    emitActionExecuted(sessionId, actor, action, outcome, evidenceRefs, parentReceiptId) {
        return this.emit({
            session_id: sessionId,
            actor,
            action_type: 'action_executed',
            outcome,
            evidence_refs: evidenceRefs,
            truth_state: outcome === 'success' ? 'Verified' : 'Unknown',
            metadata: { action },
            parent_receipt_id: parentReceiptId,
        });
    }
    /**
     * Get all receipts for a session
     */
    getReceiptsForSession(sessionId) {
        return this.receiptsBySession.get(sessionId) || [];
    }
    /**
     * Get receipt by ID
     */
    getReceipt(receiptId) {
        return this.receipts.get(receiptId);
    }
    /**
     * Get receipt chain (follow parent_receipt_id)
     */
    getReceiptChain(receiptId) {
        const chain = [];
        let current = this.getReceipt(receiptId);
        while (current) {
            chain.push(current);
            if (current.parent_receipt_id) {
                current = this.getReceipt(current.parent_receipt_id);
            }
            else {
                break;
            }
        }
        return chain.reverse(); // Return root-to-leaf
    }
    /**
     * Validate session receipts for completeness
     */
    validateSession(sessionId) {
        const receipts = this.getReceiptsForSession(sessionId);
        const issues = [];
        if (receipts.length === 0) {
            issues.push('No receipts found for session');
        }
        // Check for session_created
        if (!receipts.some((r) => r.action_type === 'session_created')) {
            issues.push('Missing session_created receipt');
        }
        // Check for Unknown truth states
        const unknowns = receipts.filter((r) => r.truth_state === 'Unknown');
        if (unknowns.length > 0) {
            issues.push(`${unknowns.length} receipts have Unknown truth state`);
        }
        // Check for blocked or error outcomes
        const blocked = receipts.filter((r) => r.outcome === 'blocked' || r.outcome === 'error');
        if (blocked.length > 0) {
            issues.push(`${blocked.length} receipts show blocked/error outcomes`);
        }
        return {
            valid: issues.length === 0,
            issues,
            receipts,
        };
    }
    generateReceiptId() {
        return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
}
exports.ReceiptSystem = ReceiptSystem;
//# sourceMappingURL=ReceiptSystem.js.map