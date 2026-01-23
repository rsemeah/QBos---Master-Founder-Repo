/**
 * ReceiptSystem™ - TruthSerum-Grade Receipt Management
 *
 * MIGRATED: Now uses TruthSerum EdDSA signing
 *
 * TRUTH REQUIREMENTS:
 * - Every engine invocation produces a receipt
 * - Every receipt is immutable and timestamped
 * - Receipts prove coordination, not just activity
 * - All receipts cryptographically signed with EdDSA
 */

import { ReceiptWriter } from '@qbos/truthserum';

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
  /**
   * Emit a receipt (immutable once created)
   * Now uses TruthSerum EdDSA signing
   */
  async emit(receipt: Omit<Receipt, 'receipt_id' | 'timestamp'>): Promise<Receipt> {
    // Use TruthSerum to create signed receipt
    const truthSerumReceipt = await ReceiptWriter.writeReceipt({
      sessionId: receipt.session_id,
      type: receipt.action_type,
      parentReceiptId: receipt.parent_receipt_id,
      details: {
        actor: receipt.actor,
        outcome: receipt.outcome,
        evidence_refs: receipt.evidence_refs,
        truth_state: receipt.truth_state,
        ...receipt.metadata
      }
    });

    // Map back to ExecutionEngine format
    const fullReceipt: Receipt = {
      receipt_id: truthSerumReceipt.id,
      session_id: truthSerumReceipt.sessionId || receipt.session_id,
      timestamp: truthSerumReceipt.createdAt,
      actor: receipt.actor,
      action_type: receipt.action_type,
      outcome: receipt.outcome,
      evidence_refs: receipt.evidence_refs,
      truth_state: receipt.truth_state,
      metadata: receipt.metadata,
      parent_receipt_id: receipt.parent_receipt_id
    };

    return fullReceipt;
  }

  /**
   * Emit session created receipt
   */
  async emitSessionCreated(sessionId: string, appName: string, goals: string[]): Promise<Receipt> {
    return await this.emit({
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
  async emitUserInput(sessionId: string, input: unknown): Promise<Receipt> {
    return await this.emit({
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
  async emitEngineInvoked(
    sessionId: string,
    engineName: string,
    durationMs: number,
    outcome: ReceiptOutcome,
    parentReceiptId?: string
  ): Promise<EngineInvocationReceipt> {
    return await this.emit({
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
  async emitGateCheck(
    sessionId: string,
    gateType: 'config' | 'paywall' | 'charter',
    gateKey: string,
    allowed: boolean,
    reason?: string,
    parentReceiptId?: string
  ): Promise<GateCheckReceipt> {
    return await this.emit({
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
  async emitActionExecuted(
    sessionId: string,
    actor: ReceiptActor,
    action: string,
    outcome: ReceiptOutcome,
    evidenceRefs: string[],
    parentReceiptId?: string
  ): Promise<Receipt> {
    return await this.emit({
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
   * Get all receipts for a session from TruthSerum
   */
  async getReceiptsForSession(sessionId: string): Promise<Receipt[]> {
    const truthSerumReceipts = await ReceiptWriter.readReceipts(sessionId);

    return truthSerumReceipts.map(r => ({
      receipt_id: r.id,
      session_id: r.sessionId || sessionId,
      timestamp: r.createdAt,
      actor: r.details.actor || 'system',
      action_type: r.type,
      outcome: r.details.outcome || 'unknown',
      evidence_refs: r.details.evidence_refs || [],
      truth_state: r.details.truth_state || 'Unknown',
      metadata: r.details,
      parent_receipt_id: r.parentReceiptId
    }));
  }

  /**
   * Get receipt by ID from TruthSerum
   */
  async getReceipt(receiptId: string): Promise<Receipt | undefined> {
    // Read all receipts and find by ID (inefficient, but works)
    const allReceipts = await ReceiptWriter.readReceipts();
    const truthSerumReceipt = allReceipts.find(r => r.id === receiptId);

    if (!truthSerumReceipt) return undefined;

    return {
      receipt_id: truthSerumReceipt.id,
      session_id: truthSerumReceipt.sessionId || '',
      timestamp: truthSerumReceipt.createdAt,
      actor: truthSerumReceipt.details.actor || 'system',
      action_type: truthSerumReceipt.type,
      outcome: truthSerumReceipt.details.outcome || 'unknown',
      evidence_refs: truthSerumReceipt.details.evidence_refs || [],
      truth_state: truthSerumReceipt.details.truth_state || 'Unknown',
      metadata: truthSerumReceipt.details,
      parent_receipt_id: truthSerumReceipt.parentReceiptId
    };
  }

  /**
   * Get receipt chain (follow parent_receipt_id)
   */
  async getReceiptChain(receiptId: string): Promise<Receipt[]> {
    const chain: Receipt[] = [];
    let current = await this.getReceipt(receiptId);

    while (current) {
      chain.push(current);
      if (current.parent_receipt_id) {
        current = await this.getReceipt(current.parent_receipt_id);
      } else {
        break;
      }
    }

    return chain.reverse(); // Return root-to-leaf
  }

  /**
   * Validate session receipts for completeness
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    issues: string[];
    receipts: Receipt[];
  }> {
    const receipts = await this.getReceiptsForSession(sessionId);
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

    // Verify receipt chain using TruthSerum
    const truthSerumReceipts = await ReceiptWriter.readReceipts(sessionId);
    const chainValidation = await ReceiptWriter.verifyReceiptChain(truthSerumReceipts);
    if (!chainValidation.valid) {
      issues.push(...chainValidation.errors);
    }

    return {
      valid: issues.length === 0,
      issues,
      receipts,
    };
  }
}
