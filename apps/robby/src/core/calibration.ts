import crypto from 'node:crypto';
import * as fs from 'node:fs';
import { robbyReceipt } from '../util/robby-receipt.js';

function deriveKeyIdFromPem(pem: string) {
  try {
    const key = crypto.createPublicKey(pem);
    const der = key.export({ type: 'spki', format: 'der' }) as Buffer;
    return crypto.createHash('sha256').update(der).digest('hex').substring(0, 16);
  } catch (e) {
    return null;
  }
}

export async function calibrate(cwd: string) {
  let publicKeyId: string | null = null;
  let mode: 'single-key' | 'registry' | 'UNKNOWN' = 'UNKNOWN';

  if (process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64) {
    try {
      const privPem = Buffer.from(process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64, 'base64').toString('utf8');
      const pubPem = crypto.createPublicKey(privPem).export({ type: 'spki', format: 'pem' }) as string;
      publicKeyId = deriveKeyIdFromPem(pubPem);
      mode = 'single-key';
    } catch (e) {
      publicKeyId = null;
    }
  }

  if (!publicKeyId && process.env.PUBLIC_KEY_PATH && fs.existsSync(process.env.PUBLIC_KEY_PATH)) {
    try {
      const pem = fs.readFileSync(process.env.PUBLIC_KEY_PATH, 'utf8');
      publicKeyId = deriveKeyIdFromPem(pem);
      mode = 'single-key';
    } catch (e) {
      // ignore
    }
  }

  if (!publicKeyId && process.env.TRUTHSERUM_PUBLIC_KEYS_JSON) {
    try {
      const parsed = JSON.parse(process.env.TRUTHSERUM_PUBLIC_KEYS_JSON) as Record<string, string>;
      const first = Object.entries(parsed)[0];
      if (first) {
        publicKeyId = first[0];
        mode = 'registry';
      }
    } catch (e) {
      // ignore
    }
  }

  const payload = { cwd, publicKeyId, mode };
  const receipt = await robbyReceipt('robby.calibration.probe', payload);
  return { status: publicKeyId ? 'READY' : 'DEGRADED', receipt };
}

