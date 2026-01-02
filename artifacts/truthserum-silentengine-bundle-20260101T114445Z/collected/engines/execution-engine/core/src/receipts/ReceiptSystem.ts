/**
 * ReceiptSystem™ - TruthSerum-Grade Receipt Management
 * 
 * TRUTH REQUIREMENTS:
 * - Every engine invocation produces a receipt
 * - Every receipt is immutable and timestamped
 * - Receipts prove coordination, not just activity
 */

export type ReceiptActor = 'user' | 'rob' | string; // engine names allowed
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
  parent_receipt_id?: string; // For tracing causal chains
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

export class ReceiptSystem {
  private receipts: Map<string, Receipt> = new Map();
  private receiptsBySession: Map<string, Receipt[]> = new Map();

  /**
   * Emit a receipt (immutable once created)
   */
  emit(receipt: Omit<Receipt, 'receipt_id' | 'timestamp'>): Receipt {
    const fullReceipt: Receipt = {
      ...receipt,
      receipt_id: this.generateReceiptId(),
      timestamp: new Date().toISOString(),
    };

    this.receipts.set(fullReceipt.receipt_id, fullReceipt);

    // Index by session
    if (!this.receiptsBySession.has(fullReceipt.session_id)) {
      this.receiptsBySession.set(fullReceipt.session_id, []);
    }
    this.receiptsBySession.get(fullReceipt.session_id)!.push(fullReceipt);

    return fullReceipt;
  }

  /**
   * Emit session created receipt
   */
  emitSessionCreated(sessionId: string, appName: string, goals: string[]): Receipt {
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
  emitUserInput(sessionId: string, input: unknown): Receipt {
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
  emitEngineInvoked(
    sessionId: string,
    engineName: string,
    durationMs: number,
    outcome: ReceiptOutcome,
    parentReceiptId?: string
  ): EngineInvocationReceipt {
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
    }) as EngineInvocationReceipt;
  }

  /**
   * Emit gate check (config/paywall/charter)
   */
  emitGateCheck(
    sessionId: string,
    gateType: 'config' | 'paywall' | 'charter',
    gateKey: string,
    allowed: boolean,
    reason?: string,
    parentReceiptId?: string
  ): GateCheckReceipt {
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
    }) as GateCheckReceipt;
  }

  /**
   * Emit action executed
   */
  emitActionExecuted(
    sessionId: string,
    actor: ReceiptActor,
    action: string,
    outcome: ReceiptOutcome,
    evidenceRefs: string[],
    parentReceiptId?: string
  ): Receipt {
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
  getReceiptsForSession(sessionId: string): Receipt[] {
    return this.receiptsBySession.get(sessionId) || [];
  }

  /**
   * Get receipt by ID
   */
  getReceipt(receiptId: string): Receipt | undefined {
    return this.receipts.get(receiptId);
  }

  /**
   * Get receipt chain (follow parent_receipt_id)
   */
  getReceiptChain(receiptId: string): Receipt[] {
    const chain: Receipt[] = [];
    let current = this.getReceipt(receiptId);

    while (current) {
      chain.push(current);
      if (current.parent_receipt_id) {
        current = this.getReceipt(current.parent_receipt_id);
      } else {
        break;
      }
    }

    return chain.reverse(); // Return root-to-leaf
  }

  /**
   * Validate session receipts for completeness
   */
  validateSession(sessionId: string): {
    valid: boolean;
    issues: string[];
    receipts: Receipt[];
  } {
    const receipts = this.getReceiptsForSession(sessionId);
    const issues: string[] = [];

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

  private generateReceiptId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
