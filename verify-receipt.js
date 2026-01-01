const { createPublicKey, verify } = require('crypto');
const fs = require('fs');
const path = require('path');

function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  const keys = Object.keys(obj).sort();
  const out = {};
  for (const k of keys) out[k] = canonicalize(obj[k]);
  return out;
}

function loadPublicKey() {
  if (process.env.PUBLIC_KEY_PEM_BASE64) {
    const pubPem = Buffer.from(process.env.PUBLIC_KEY_PEM_BASE64, 'base64').toString('utf8');
    try {
      return createPublicKey(pubPem);
    } catch (e) {
      // fall through to try DER decode
      const inner = pubPem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s+/g, '');
      const der = Buffer.from(inner, 'base64');
      return createPublicKey({ key: der, format: 'der', type: 'spki' });
    }
  }
  if (process.env.PUBLIC_KEY_PATH) {
    const p = path.resolve(process.env.PUBLIC_KEY_PATH);
    const pem = fs.readFileSync(p, 'utf8');
    try {
      return createPublicKey(pem);
    } catch (e) {
      // try reading as raw DER or inner base64
      const inner = pem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s+/g, '');
      try {
        const der = Buffer.from(inner, 'base64');
        return createPublicKey({ key: der, format: 'der', type: 'spki' });
      } catch (err) {
        // try reading file as binary DER
        const bin = fs.readFileSync(p);
        return createPublicKey({ key: bin, format: 'der', type: 'spki' });
      }
    }
  }
  throw new Error('Set PUBLIC_KEY_PEM_BASE64 or PUBLIC_KEY_PATH');
}

const receiptsPath = process.argv[2] || 'proof/local_receipts.cleaned.jsonl';
const content = fs.readFileSync(receiptsPath, 'utf8').trim();
if (!content) throw new Error('No receipts found in ' + receiptsPath);
const line = content.split('\n').pop();
const r = JSON.parse(line);

const key = loadPublicKey();
const sig = Buffer.from(r.signature, 'base64');

// compute key id (first 16 chars of sha256 of DER SPKI)
const der = key.export ? key.export({ type: 'spki', format: 'der' }) : null;
let computedKeyId = null;
if (der) {
  const { createHash } = require('crypto');
  computedKeyId = createHash('sha256').update(der).digest('hex').slice(0, 16);
  console.log('computed public key id:', computedKeyId);
} else {
  console.log('could not export public key to DER to compute key id');
}
console.log('receipt signerKeyId:', r.signerKeyId || '<none>');

const payloadObj = {
  id: r.id,
  createdAt: r.createdAt,
  sessionId: r.sessionId || null,
  type: r.type,
  verification_hash: r.verification_hash,
  parentReceiptId: r.parentReceiptId || null,
  nonce: r.nonce,
};
const payload = JSON.stringify(canonicalize(payloadObj));

const ok = verify(null, Buffer.from(payload), key, sig);
console.log('receipt id:', r.id, 'verified:', ok);
