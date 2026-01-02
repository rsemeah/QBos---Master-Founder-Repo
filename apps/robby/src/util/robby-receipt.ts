import * as fs from 'node:fs';
import * as path from 'node:path';

const RECEIPTS_PATH = path.resolve('receipts/robby/robby.receipts.jsonl');

export type RobbyReceipt = {
  id: string;
  timestamp: string;
  type: string;
  payload: any;
  signerKeyId?: string | null;
  signature?: string | null;
};

export async function ensureReceiptsDir() {
  const dir = path.dirname(RECEIPTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function robbyReceipt(type: string, payload: any = {}): Promise<RobbyReceipt> {
  await ensureReceiptsDir();

  const id = `${type.replace(/[^a-z0-9_.-]/gi, '_')}_${Date.now()}`;
  const r: RobbyReceipt = {
    id,
    timestamp: new Date().toISOString(),
    type,
    payload
  };

  try {
    // Try to dynamically load the ReceiptWriter in a resilient way
    let ReceiptWriter: any = null;
    try {
      const mod = await import('@qbos/truthserum');
      ReceiptWriter = (mod as any).ReceiptWriter ?? (mod as any).default ?? mod;
    } catch (e) {
      ReceiptWriter = null;
    }

    const hasPrivateKey = !!process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64;
    const hasPublicKeyPath = !!process.env.PUBLIC_KEY_PATH || fs.existsSync('.keys/public.pem');

    if (hasPrivateKey && ReceiptWriter && typeof ReceiptWriter.writeReceipt === 'function') {
      try {
        const signed = await ReceiptWriter.writeReceipt({ sessionId: 'robby', type, details: payload });
        r.signerKeyId = signed.signerKeyId || null;
        r.signature = signed.signature || null;
      } catch (e: any) {
        r.signerKeyId = null;
        r.signature = null;
        r.payload.__error = `ReceiptWriter signing failed: ${String(e?.message || e)}`;
      }
    } else if (hasPublicKeyPath) {
      r.signerKeyId = null;
      r.signature = null;
      r.payload.__status = 'DEGRADED_NO_SIGNING_KEY';
    } else {
      r.signerKeyId = null;
      r.signature = null;
      r.payload.__status = 'BLOCKED_NO_KEYS';
    }
  } catch (err: any) {
    r.signerKeyId = null;
    r.signature = null;
    r.payload.__error = String(err?.message || err);
  }

  fs.appendFileSync(RECEIPTS_PATH, JSON.stringify(r) + '\n', 'utf8');
  return r;
}
