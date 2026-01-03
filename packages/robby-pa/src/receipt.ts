import { createHash, createHmac } from 'crypto';

export interface Receipt {
  id: string;
  sessionId: string;
  seq: number;
  prevHash: string | null;
  type: string;
  payload: any;
  artifactRefs?: any[] | null;
  macKeyId: string;
  hash: string;
  mac: string;
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

const ENV_MAC_SECRET = process.env.ROBBY_RECEIPT_MAC_SECRET;
if (!ENV_MAC_SECRET) {
  // Don't throw here — allow library import; functions will throw at runtime if secret missing.
}

export const DEFAULT_MAC_KEY_ID = process.env.ROBBY_RECEIPT_MAC_KEY_ID || 'robby-v1-primary';

export async function createReceipt(params: CreateReceiptParams): Promise<Receipt> {
  const { sessionId, type, payload, artifactRefs, store } = params;

  if (!process.env.ROBBY_RECEIPT_MAC_SECRET) {
    throw new Error('ROBBY_RECEIPT_MAC_SECRET not configured');
  }

  const prev = await store.getLastReceiptForSession(sessionId);
  const seq = prev ? prev.seq + 1 : 0;
  const prevHash = prev ? prev.hash : null;

  const baseReceipt = {
    id: generateId(),
    sessionId,
    seq,
    prevHash,
    type,
    payload,
    artifactRefs: artifactRefs || null,
    macKeyId: DEFAULT_MAC_KEY_ID,
    createdAt: new Date().toISOString()
  } as any;

  // Hash of receipt (excluding mac)
  const hash = createHash('sha256').update(JSON.stringify(baseReceipt)).digest('hex');

  const mac = createHmac('sha256', process.env.ROBBY_RECEIPT_MAC_SECRET as string)
    .update(hash)
    .digest('hex');

  const signed = {
    ...baseReceipt,
    hash,
    mac
  } as Receipt;

  // Persist
  await store.insertReceipt(signed as any);

  return signed;
}

export async function verifyReceipt(receipt: Receipt): Promise<boolean> {
  if (!process.env.ROBBY_RECEIPT_MAC_SECRET) throw new Error('ROBBY_RECEIPT_MAC_SECRET not configured');

  const { mac, hash, ...receiptWithoutMac } = receipt as any;

  const computedHash = createHash('sha256').update(JSON.stringify(receiptWithoutMac)).digest('hex');
  if (computedHash !== hash) return false;

  const expectedMac = createHmac('sha256', process.env.ROBBY_RECEIPT_MAC_SECRET as string)
    .update(hash)
    .digest('hex');

  return mac === expectedMac;
}

export async function verifyReceiptChain(receipts: Receipt[]): Promise<boolean> {
  // receipts should be ordered ascending by seq
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    const ok = await verifyReceipt(r);
    if (!ok) return false;

    if (i === 0) {
      if (r.prevHash !== null) return false;
      if (r.seq !== 0) return false;
    } else {
      const prev = receipts[i - 1];
      if (r.prevHash !== prev.hash) return false;
      if (r.seq !== prev.seq + 1) return false;
    }
  }
  return true;
}

function generateId(): string {
  return 'rcpt_' + Math.random().toString(36).slice(2, 10);
}

export { };
