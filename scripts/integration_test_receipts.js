#!/usr/bin/env node
// Integration test: posts a genuine unsigned receipt (server should sign) and a forged signed receipt (server should reject)
const https = require('http');
const http = require('http');
const crypto = require('crypto');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 3001;
const base = `http://localhost:${port}`;

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      base + path,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('Integration test against', base);

  // 1) Genuine unsigned receipt -> server should sign and return 200
  const genuine = { sessionId: 'int-test-1', type: 'integration.test', details: { ok: true } };
  const g = await post('/api/receipts', genuine);
  console.log('genuine status', g.status);
  if (g.status !== 200) {
    console.error('Genuine receipt failed:', g.status, g.body);
    process.exit(2);
  }

  // 2) Forged: craft a signed-looking receipt with random sig/key -> should be rejected (400)
  const forged = {
    id: `forged-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sessionId: 'int-test-forged',
    type: 'integration.test.forged',
    details: { bogus: true },
    verification_hash: crypto.createHash('sha256').update(JSON.stringify({ bogus: true })).digest('hex'),
    nonce: crypto.randomBytes(16).toString('hex'),
    signerKeyId: 'attacker-1',
    sig: crypto.randomBytes(64).toString('base64'),
    algo: 'Ed25519',
  };

  const f = await post('/api/receipts', forged);
  console.log('forged status', f.status);
  if (f.status === 200) {
    console.error('Forged receipt unexpectedly accepted');
    process.exit(3);
  }

  console.log('Integration test passed: genuine accepted, forged rejected');
  process.exit(0);
})();
