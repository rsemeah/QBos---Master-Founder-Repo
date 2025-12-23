/**
 * TruthSerumValidator™ - Investor-Grade Proof Mechanism
 * 
 * VALIDATES:
 * - Engine awareness (who talks to who)
 * - Coordination proofs (receipts)
 * - Ordering enforcement
 * - No false claims
 */

import type { Receipt } from './ReceiptSystem';

export interface EngineInteraction {
  from: string;
  to: string;
  evidence: string; // receipt ID
  verified: boolean;
}

export interface EngineAwarenessMatrix {
  engines: string[];
  interactions: EngineInteraction[];
}

export interface TruthSerumReport {
  sessionId: string;
  valid: boolean;
  engineAwarenessMatrix: EngineAwarenessMatrix;
  orderingViolations: string[];
  missingReceipts: string[];
  unverifiedClaims: string[];
  summary: {
    enginesInvoked: string[];
    gatesChecked: string[];
    totalReceipts: number;
    verifiedReceipts: number;
    unknownReceipts: number;
  };
}

export class TruthSerumValidator {
  /**
   * Audit a session's receipts for TruthSerum compliance
   */
  validate(sessionId: string, receipts: Receipt[]): TruthSerumReport {
    const orderingViolations: string[] = [];
    const missingReceipts: string[] = [];
    const unverifiedClaims: string[] = [];
    const enginesInvoked: Set<string> = new Set();
    const gatesChecked: Set<string> = new Set();
    const interactions: EngineInteraction[] = [];

    // Track receipt chain
    const receiptMap = new Map<string, Receipt>();
    receipts.forEach((r) => receiptMap.set(r.receipt_id, r));

    // Validate each receipt
    for (const receipt of receipts) {
      // Track engines
      if (receipt.action_type === 'engine_invoked') {
        const engineName = (receipt.metadata as any)?.engine_name || receipt.actor;
        enginesInvoked.add(engineName);

        // Build interaction chain
        if (receipt.parent_receipt_id) {
          const parent = receiptMap.get(receipt.parent_receipt_id);
          if (parent) {
            const fromEngine = this.extractEngine(parent);
            const toEngine = engineName;
            interactions.push({
              from: fromEngine,
              to: toEngine,
              evidence: receipt.receipt_id,
              verified: receipt.truth_state === 'Verified',
            });
          }
        }
      }

      // Track gates
      if (receipt.action_type === 'gate_checked') {
        const gateType = (receipt.metadata as any)?.gate_type;
        if (gateType) {
          gatesChecked.add(gateType);
        }
      }

      // Check for Unknown truth state
      if (receipt.truth_state === 'Unknown') {
        unverifiedClaims.push(
          `Receipt ${receipt.receipt_id}: ${receipt.action_type} has Unknown truth state`
        );
      }

      // Check for missing parent receipts
      if (receipt.parent_receipt_id && !receiptMap.has(receipt.parent_receipt_id)) {
        missingReceipts.push(
          `Receipt ${receipt.receipt_id} references missing parent ${receipt.parent_receipt_id}`
        );
      }
    }

    // Validate canonical ordering (if AI invocation exists)
    const hasAI = receipts.some(
      (r) =>
        r.action_type === 'engine_invoked' &&
        (r.metadata as any)?.engine_name === 'SilentEngine'
    );

    if (hasAI) {
      orderingViolations.push(...this.validateAIFlowOrdering(receipts));
    }

    // Build awareness matrix
    const engineAwarenessMatrix: EngineAwarenessMatrix = {
      engines: Array.from(enginesInvoked),
      interactions,
    };

    // Calculate summary
    const verifiedReceipts = receipts.filter((r) => r.truth_state === 'Verified').length;
    const unknownReceipts = receipts.filter((r) => r.truth_state === 'Unknown').length;

    const valid =
      orderingViolations.length === 0 &&
      missingReceipts.length === 0 &&
      unverifiedClaims.length === 0;

    return {
      sessionId,
      valid,
      engineAwarenessMatrix,
      orderingViolations,
      missingReceipts,
      unverifiedClaims,
      summary: {
        enginesInvoked: Array.from(enginesInvoked),
        gatesChecked: Array.from(gatesChecked),
        totalReceipts: receipts.length,
        verifiedReceipts,
        unknownReceipts,
      },
    };
  }

  /**
   * Validate canonical AI flow ordering:
   * 1. Identity
   * 2. Charter (consent)
   * 3. Config (gate)
   * 4. Paywall (entitlement)
   * 5. SilentEngine (AI)
   */
  private validateAIFlowOrdering(receipts: Receipt[]): string[] {
    const violations: string[] = [];
    const orderedEngines = ['IdentityEngine', 'charterEngine', 'configEngine', 'paywallEngine', 'SilentEngine'];

    // Find timestamps of each engine invocation
    const engineTimestamps = new Map<string, number>();

    for (const receipt of receipts) {
      if (receipt.action_type === 'engine_invoked') {
        const engineName = (receipt.metadata as any)?.engine_name || receipt.actor;
        const timestamp = new Date(receipt.timestamp).getTime();

        if (!engineTimestamps.has(engineName)) {
          engineTimestamps.set(engineName, timestamp);
        }
      } else if (receipt.action_type === 'gate_checked') {
        const gateType = (receipt.metadata as any)?.gate_type;
        const engineName = gateType ? gateType + 'Engine' : receipt.actor;
        const timestamp = new Date(receipt.timestamp).getTime();

        if (!engineTimestamps.has(engineName)) {
          engineTimestamps.set(engineName, timestamp);
        }
      }
    }

    // Check ordering
    let lastTimestamp = 0;
    for (const engineName of orderedEngines) {
      const timestamp = engineTimestamps.get(engineName);
      if (timestamp !== undefined) {
        if (timestamp < lastTimestamp) {
          violations.push(
            `Ordering violation: ${engineName} ran at ${new Date(timestamp).toISOString()} before expected sequence`
          );
        }
        lastTimestamp = timestamp;
      }
    }

    // Ensure SilentEngine ran AFTER all gates
    const silentTimestamp = engineTimestamps.get('SilentEngine');
    if (silentTimestamp) {
      for (const [engine, timestamp] of engineTimestamps.entries()) {
        if (
          ['charterEngine', 'configEngine', 'paywallEngine'].includes(engine) &&
          timestamp > silentTimestamp
        ) {
          violations.push(
            `Gate ${engine} ran AFTER SilentEngine - gates must run BEFORE action`
          );
        }
      }
    }

    return violations;
  }

  private extractEngine(receipt: Receipt): string {
    if (receipt.action_type === 'engine_invoked') {
      return (receipt.metadata as any)?.engine_name || receipt.actor;
    }
    if (receipt.action_type === 'gate_checked') {
      const gateType = (receipt.metadata as any)?.gate_type;
      return gateType ? gateType + 'Engine' : receipt.actor;
    }
    return receipt.actor;
  }

  /**
   * Generate human-readable report
   */
  generateReport(report: TruthSerumReport): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════');
    lines.push('TRUTHSERUM VALIDATION REPORT');
    lines.push('═══════════════════════════════════════════════');
    lines.push('');
    lines.push(`Session ID: ${report.sessionId}`);
    lines.push(`Status: ${report.valid ? '✅ VERIFIED' : '❌ INVALID'}`);
    lines.push('');

    lines.push('ENGINE AWARENESS MATRIX');
    lines.push('─────────────────────────────────────────────');
    if (report.engineAwarenessMatrix.interactions.length === 0) {
      lines.push('⚠️  No engine interactions detected');
    } else {
      for (const interaction of report.engineAwarenessMatrix.interactions) {
        const status = interaction.verified ? '✅' : '❌';
        lines.push(`${status} ${interaction.from} → ${interaction.to}`);
        lines.push(`   Evidence: ${interaction.evidence}`);
      }
    }
    lines.push('');

    lines.push('SUMMARY');
    lines.push('─────────────────────────────────────────────');
    lines.push(`Engines Invoked: ${report.summary.enginesInvoked.join(', ') || 'None'}`);
    lines.push(`Gates Checked: ${report.summary.gatesChecked.join(', ') || 'None'}`);
    lines.push(`Total Receipts: ${report.summary.totalReceipts}`);
    lines.push(`Verified: ${report.summary.verifiedReceipts}`);
    lines.push(`Unknown: ${report.summary.unknownReceipts}`);
    lines.push('');

    if (report.orderingViolations.length > 0) {
      lines.push('⚠️  ORDERING VIOLATIONS');
      lines.push('─────────────────────────────────────────────');
      report.orderingViolations.forEach((v) => lines.push(`  • ${v}`));
      lines.push('');
    }

    if (report.missingReceipts.length > 0) {
      lines.push('⚠️  MISSING RECEIPTS');
      lines.push('─────────────────────────────────────────────');
      report.missingReceipts.forEach((m) => lines.push(`  • ${m}`));
      lines.push('');
    }

    if (report.unverifiedClaims.length > 0) {
      lines.push('⚠️  UNVERIFIED CLAIMS');
      lines.push('─────────────────────────────────────────────');
      report.unverifiedClaims.forEach((u) => lines.push(`  • ${u}`));
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════');

    return lines.join('\n');
  }
}
