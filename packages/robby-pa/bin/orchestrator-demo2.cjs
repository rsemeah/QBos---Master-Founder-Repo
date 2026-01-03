#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAC_SECRET = process.env.ROBBY_RECEIPT_MAC_SECRET;
if (!MAC_SECRET) {
  console.error('Set ROBBY_RECEIPT_MAC_SECRET');
  process.exit(2);
}

function generateId() { return 'rcpt_' + Math.random().toString(36).slice(2, 10); }
function hashObj(o) { return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex'); }
function macOf(h) { return crypto.createHmac('sha256', MAC_SECRET).update(h).digest('hex'); }

const receiptsBySession = new Map();
function getLast(sessionId) { const a = receiptsBySession.get(sessionId) || []; return a.length ? a[a.length - 1] : null; }
function insertReceipt(r) { const a = receiptsBySession.get(r.sessionId) || []; a.push(r); receiptsBySession.set(r.sessionId, a); return r; }
function getReceipts(sessionId) { return receiptsBySession.get(sessionId) || []; }

async function run() {
  const sessionId = 'session_orch_1';

  // create session.created
  const base1 = { id: generateId(), sessionId, seq: 0, prevHash: null, type: 'session.created', payload: { note: 'orch demo' }, artifactRefs: null, macKeyId: 'robby-v1-primary', createdAt: new Date().toISOString() };
  base1.hash = hashObj(base1);
  base1.mac = macOf(base1.hash);
  insertReceipt(base1);
  console.log('created receipt seq0');

  // simulate adapter invocation
  const task = { id: 'task1', engine: 'SilentEngine', params: { prompt: 'generate' } };
  const prev = getLast(sessionId);
  const seq1 = prev.seq + 1;

  const started = { id: generateId(), sessionId, seq: seq1, prevHash: prev.hash, type: 'task.started', payload: { taskId: task.id, engine: task.engine }, artifactRefs: null, macKeyId: 'robby-v1-primary', createdAt: new Date().toISOString() };
  started.hash = hashObj(started);
  started.mac = macOf(started.hash);
  insertReceipt(started);
  console.log('task.started emitted');

  // adapter stub -> produce artifact content
  const content = `stub-output for ${task.id} ${JSON.stringify(task.params)}`;
  const dir = path.join(process.cwd(), '.robby', 'artifacts', sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const filename = path.join(dir, `artifact_${task.id}.txt`);
  fs.writeFileSync(filename, content, 'utf8');
  const sha = crypto.createHash('sha256').update(content).digest('hex');
  const artifactRef = { uri: `file://${filename}`, sha256: sha, contentType: 'text/plain' };

  const prev2 = getLast(sessionId);
  const seq2 = prev2.seq + 1;
  const completed = { id: generateId(), sessionId, seq: seq2, prevHash: prev2.hash, type: 'task.completed', payload: { taskId: task.id, engine: task.engine }, artifactRefs: [artifactRef], macKeyId: 'robby-v1-primary', createdAt: new Date().toISOString() };
  completed.hash = hashObj(completed);
  completed.mac = macOf(completed.hash);
  insertReceipt(completed);
  console.log('task.completed emitted');

  console.log('Receipts:');
  console.log(getReceipts(sessionId).map(r => ({ seq: r.seq, type: r.type, mac_ok: macOf(r.hash) === r.mac })));
}

run().catch(e => { console.error(e); process.exit(1); });
