/**
 * Robby PA Receipt System
 *
 * MIGRATED: Now uses TruthSerum EdDSA signing instead of HMAC
 * Provides backward-compatible interface for Robby PA
 */

import { ReceiptWriter } from '@qbos/truthserum';

export interface Receipt {
  id: string;
  sessionId: string;
  seq: number;
  prevHash: string | null;
  type: string;
  payload: any;
  artifactRefs?: any[] | null;
  macKeyId: string;        // Now maps to signerKeyId (EdDSA)
  hash: string;            // Now maps to verification_hash
  mac: string;             // Now maps to signature (EdDSA)
  createdAt: string;
}

export interface CreateReceiptParams {
  sessionId: string;
  type: string;
  payload: object;
  artifactRefs?: Array<{ uri: string; sha256: string; contentType: string; provenance?: object }>;
  store: {
    getLastReceiptForSession: (sessionId: string) => Promise<Receipt | null>;
    insertReceipt: (r: Omit<Receipt, 'hash' | 'mac'> & { hash?: string; mac?: string }) => Promise<Receipt>;
  };
}

export const DEFAULT_MAC_KEY_ID = process.env.ROBBY_RECEIPT_MAC_KEY_ID || 'robby-v1-primary';

/**
 * Create receipt using TruthSerum EdDSA signing
 * Maintains backward-compatible interface
 */
export async function createReceipt(params: CreateReceiptParams): Promise<Receipt> {
  const { sessionId, type, payload, artifactRefs } = params;

  // Use TruthSerum to create signed receipt
  const truthSerumReceipt = await ReceiptWriter.writeReceipt({
    sessionId,
    type,
    details: {
      ...payload,
      artifactRefs: artifactRefs || null
    }
  });

  // Map TruthSerum receipt to Robby PA format
  const robbyReceipt: Receipt = {
    id: truthSerumReceipt.id,
    sessionId: truthSerumReceipt.sessionId || sessionId,
    seq: truthSerumReceipt.seq ?? 0,
    prevHash: truthSerumReceipt.prevHash || null,
    type: truthSerumReceipt.type,
    payload: truthSerumReceipt.details,
    artifactRefs: truthSerumReceipt.details.artifactRefs || null,
    macKeyId: truthSerumReceipt.signerKeyId || 'unknown',
    hash: truthSerumReceipt.verification_hash || '',
    mac: truthSerumReceipt.signature || '',
    createdAt: truthSerumReceipt.createdAt
  };

  return robbyReceipt;
}

/**
 * Verify receipt using TruthSerum EdDSA verification
 */
export async function verifyReceipt(receipt: Receipt): Promise<boolean> {
  // Map Robby PA receipt to TruthSerum format
  const truthSerumReceipt = {
    id: receipt.id,
    createdAt: receipt.createdAt,
    sessionId: receipt.sessionId,
    seq: receipt.seq,
    prevHash: receipt.prevHash,
    type: receipt.type,
    details: receipt.payload,
    signerKeyId: receipt.macKeyId,
    signature: receipt.mac,
    verification_hash: receipt.hash,
    algo: 'Ed25519' as const,
    nonce: '' // Not used in old receipts
  };

  return await ReceiptWriter.verifyReceipt(truthSerumReceipt);
}

/**
 * Verify receipt chain using TruthSerum chain validation
 */
export async function verifyReceiptChain(receipts: Receipt[]): Promise<boolean> {
  // Map to TruthSerum format
  const truthSerumReceipts = receipts.map(r => ({
    id: r.id,
    createdAt: r.createdAt,
    sessionId: r.sessionId,
    seq: r.seq,
    prevHash: r.prevHash,
    type: r.type,
    details: r.payload,
    signerKeyId: r.macKeyId,
    signature: r.mac,
    verification_hash: r.hash,
    algo: 'Ed25519' as const,
    nonce: ''
  }));

  const result = await ReceiptWriter.verifyReceiptChain(truthSerumReceipts);
  return result.valid;
}

function generateId(): string {
  return 'rcpt_' + Math.random().toString(36).slice(2, 10);
}

export { };
