#!/usr/bin/env node
const crypto = require('crypto');

const MAC_SECRET = process.env.ROBBY_RECEIPT_MAC_SECRET;
const MAC_KEY_ID = process.env.ROBBY_RECEIPT_MAC_KEY_ID || 'robby-v1-primary';

if (!MAC_SECRET) {
  console.error('ROBBY_RECEIPT_MAC_SECRET not configured in environment');
  process.exit(2);
}

function generateId() {
  return 'rcpt_' + Math.random().toString(36).slice(2, 10);
}

function hash(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function macOf(hashHex) {
  return crypto.createHmac('sha256', MAC_SECRET).update(hashHex).digest('hex');
}

async function demo() {
  const sessionId = 'sess_demo_1';
  const receipts = [];

  function create(params) {
    const prev = receipts.length ? receipts[receipts.length - 1] : null;
    const seq = prev ? prev.seq + 1 : 0;
    const prevHash = prev ? prev.hash : null;

    const base = {
      id: generateId(),
      sessionId,
      seq,
      prevHash,
      type: params.type,
      payload: params.payload || {},
      artifactRefs: params.artifactRefs || null,
      macKeyId: MAC_KEY_ID,
      createdAt: new Date().toISOString()
    };

    const h = hash(base);
    const m = macOf(h);
    const signed = Object.assign({}, base, { hash: h, mac: m });
    receipts.push(signed);
    return signed;
  }

  function verifySingle(r) {
    const { mac, hash: h, ...rest } = r;
    const computed = hash(rest);
    if (computed !== h) return false;
    const ok = macOf(h) === mac;
    return ok;
  }

  // create two receipts
  console.log('Creating receipts...');
  create({ type: 'session.created', payload: { note: 'demo session' } });
  create({ type: 'intent.locked', payload: { by: 'user:demo' } });

  console.log('Receipts:');
  console.log(JSON.stringify(receipts, null, 2));

  console.log('\nVerifying receipts...');
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    const ok = verifySingle(r);
    console.log(`seq=${r.seq} id=${r.id} ok=${ok}`);
    if (!ok) process.exitCode = 3;
    if (i === 0) {
      if (r.prevHash !== null || r.seq !== 0) {
        console.error('First receipt link invalid');
        process.exitCode = 4;
      }
    } else {
      const prev = receipts[i - 1];
      if (r.prevHash !== prev.hash) {
        console.error('Chain broken at seq', r.seq);
        process.exitCode = 5;
      }
    }
  }

  if (!process.exitCode) console.log('All receipts verified OK');
}

demo().catch(err => {
  console.error(err);
  process.exit(1);
});
