#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function canonicalize(obj) {
  const step = (v) => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(step);
    const out = {};
    Object.keys(v).sort().forEach((k) => { out[k] = step(v[k]); });
    return out;
  };
  return JSON.stringify(step(obj));
}

function loadEnvKeypair() {
  const privB64 = process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64;
  const pubB64 = process.env.TRUTHSERUM_PUBLIC_KEY_PEM_BASE64;
  if (privB64 && pubB64) {
    try {
      const privPem = Buffer.from(privB64, 'base64').toString('utf8');
      const pubPem = Buffer.from(pubB64, 'base64').toString('utf8');
      const privKey = crypto.createPrivateKey(privPem);
      return { privateKey: privKey, publicKeyPem: pubPem, source: 'env' };
    } catch (err) {
      console.warn('Failed to load env keypair (invalid PEM/base64). Falling back to ephemeral. Error:', err && err.message);
      return null;
    }
  }
  return null;
}

function generateEphemeral() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
  return { privateKey: crypto.createPrivateKey(privPem), publicKeyPem: pubPem, source: 'ephemeral' };
}

function keyIdFromPubPem(pubPem) {
  const pubDer = crypto.createPublicKey(pubPem).export({ type: 'spki', format: 'der' });
  return crypto.createHash('sha256').update(pubDer).digest('hex').substring(0, 16);
}

async function run() {
  try {
    console.log('SMOKE: initializing keystore...');
    let kp = loadEnvKeypair();
    if (!kp) {
      console.log('No env keys found — generating ephemeral keypair');
      kp = generateEphemeral();
    } else {
      console.log('Loaded keypair from env');
    }

    const keyId = keyIdFromPubPem(kp.publicKeyPem);
    console.log('Key ID:', keyId, 'source:', kp.source);

    // Build unsigned payload
    const unsigned = {
      id: `smoke_${Date.now()}`,
      createdAt: new Date().toISOString(),
      sessionId: 'smoke-test',
      type: 'smoke.test',
      verification_hash: null,
      parentReceiptId: null,
      nonce: crypto.randomBytes(8).toString('hex')
    };

    const details = { message: 'hello truthserum', ts: new Date().toISOString() };
    unsigned.verification_hash = crypto.createHash('sha256').update(JSON.stringify(details)).digest('hex');

    const canonical = canonicalize(unsigned);

    // sign
    if (!kp.privateKey) throw new Error('No private key for signing');
    const sig = crypto.sign(null, Buffer.from(canonical, 'utf8'), kp.privateKey).toString('base64');

    const signed = {
      ...unsigned,
      details,
      signerKeyId: keyId,
      signature: sig,
      algo: 'Ed25519'
    };

    // persist locally
    const outDir = path.join(process.cwd(), 'proof');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'local_receipts.jsonl');
    fs.appendFileSync(outPath, JSON.stringify(signed) + '\n', 'utf8');

    console.log('Wrote signed receipt to', outPath);
    console.log('Signed receipt:', JSON.stringify(signed, null, 2));

    // verify using the in-memory public key
    const publicKey = crypto.createPublicKey(kp.publicKeyPem);
    const verified = crypto.verify(null, Buffer.from(canonical, 'utf8'), publicKey, Buffer.from(sig, 'base64'));
    console.log('Verification (in-memory public key):', verified);

    // Side-effects list
    console.log('\nSide effects:');
    console.log('- Files written: ' + outPath);
    console.log('- Files read: none');
    console.log('- Environment variables used: TRUTHSERUM_PRIVATE_KEY_PEM_BASE64, TRUTHSERUM_PUBLIC_KEY_PEM_BASE64');
    console.log('- External services touched: none');
    console.log('- Persistent state modified: appended to proof/local_receipts.jsonl');

    process.exit(verified ? 0 : 3);
  } catch (err) {
    console.error('SMOKE FAILED:', err);
    process.exit(2);
  }
}

run();
