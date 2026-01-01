#!/usr/bin/env node
// Stress test: generate genuine receipts (server-signed) and forged receipts (client-signed wrong)
const crypto = require('crypto');

// Minimal arg parsing to avoid external deps. Usage: --port 3001 --workers 4 --genuine 1000 --forged 1000
const raw = process.argv.slice(2);
const args = {};
for (let i = 0; i < raw.length; i++) {
  const a = raw[i];
  if (a.startsWith('--')) {
    const key = a.replace(/^--+/, '');
    const val = raw[i + 1] && !raw[i + 1].startsWith('--') ? raw[++i] : 'true';
    args[key] = val;
  }
}

const port = parseInt(args.port || args.p, 10) || 3001;
const workers = parseInt(args.workers || args.w, 10) || 4;
const genuine = parseInt(args.genuine || args.g, 10) || 1000;
const forged = parseInt(args.forged || args.f, 10) || 1000;
const base = `http://localhost:${port}`;
const fetch = global.fetch.bind(global);

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.text() };
}

async function runGenuine(n) {
  console.log('Generating', n, 'server-signed receipts via /api/receipts (unsigned -> server signs)');
  const batch = Array.from({ length: n });
  for (let i = 0; i < batch.length; i++) {
    const body = {
      sessionId: `stress-${Date.now()}-${i}`,
      type: 'stress.test',
      details: { idx: i, ts: new Date().toISOString() },
    };
    const r = await post('/api/receipts', body);
    if (r.status !== 200) console.error('genuine write failed', r.status, r.body);
    if (i % 10000 === 0 && i > 0) console.log('genuine:', i);
  }
}

async function runForged(n) {
  console.log('Generating', n, 'forged receipts (random sigs)');
  for (let i = 0; i < n; i++) {
    const bogus = {
      id: `forged-${Date.now()}-${i}`,
      createdAt: new Date().toISOString(),
      sessionId: `stress-forged-${i}`,
      type: 'stress.forged',
      details: { bogus: true, i },
      verification_hash: crypto.createHash('sha256').update(JSON.stringify({ bogus: true, i })).digest('hex'),
      nonce: crypto.randomBytes(16).toString('hex'),
      signerKeyId: 'attacker-1',
      sig: crypto.randomBytes(64).toString('base64'),
      algo: 'Ed25519',
    };
    const r = await post('/api/receipts', bogus);
    if (r.status === 200) console.error('FORGED ACCEPTED!', bogus.id);
    if (i % 10000 === 0 && i > 0) console.log('forged:', i);
  }
}

(async () => {
  console.log('Stress test starting', { port, workers, genuine, forged });
  const g = runGenuine(genuine);
  const f = runForged(forged);
  await Promise.all([g, f]);
  console.log('Stress test completed');
})();
