#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// self-contained preview generator (avoids requiring compiled TS)
const fsPromises = require('fs').promises;
function generateSecureToken() { return crypto.randomBytes(24).toString('hex'); }
async function ensurePreviewDir() { const dir = path.join(process.cwd(), '.robby', 'previews'); await fsPromises.mkdir(dir, { recursive: true }); return dir; }
async function generatePreviewInline(sessionId, artifactPaths, receiptStore) {
  const dir = await ensurePreviewDir();
  const accessToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const previewConfig = {
    previewUrl: `http://localhost:3001/preview/${sessionId}`,
    expiresAt,
    accessToken,
    indexed: false,
    rateLimited: true,
    maxRequests: 1000,
    artifactPaths
  };
  const file = path.join(dir, `${sessionId}.json`);
  await fsPromises.writeFile(file, JSON.stringify(previewConfig, null, 2), 'utf8');

  // emit receipt via receiptStore
  const base = { id: 'rcpt_' + Math.random().toString(36).slice(2, 10), sessionId, seq: (receiptStore.getLastReceiptForSession(sessionId)?.seq || 0) + 1, prevHash: receiptStore.getLastReceiptForSession(sessionId)?.hash || null, type: 'preview.created', payload: { url: previewConfig.previewUrl, expiresAt }, artifactRefs: artifactPaths.map(p => ({ uri: p })), macKeyId: 'robby-v1-primary', createdAt: new Date().toISOString() };
  base.hash = crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex');
  base.mac = crypto.createHmac('sha256', process.env.ROBBY_RECEIPT_MAC_SECRET).update(base.hash).digest('hex');
  receiptStore.insertReceipt(base);

  return previewConfig;
}

if (!process.env.ROBBY_RECEIPT_MAC_SECRET) {
  console.error('Set ROBBY_RECEIPT_MAC_SECRET');
  process.exit(2);
}

// simple in-memory receipt store used by preview generator
const receiptsBySession = new Map();
function getLastReceiptForSession(s) { const a = receiptsBySession.get(s) || []; return a.length ? a[a.length - 1] : null; }
function insertReceipt(r) { const a = receiptsBySession.get(r.sessionId) || []; a.push(r); receiptsBySession.set(r.sessionId, a); return r; }

async function demo() {
  const sessionId = 'session_preview_demo';

  // create a fake artifact
  const dir = path.join(process.cwd(), '.robby', 'artifacts', sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const filename = path.join(dir, 'index.html');
  fs.writeFileSync(filename, '<h1>Preview</h1>', 'utf8');

  const receiptStore = { getLastReceiptForSession, insertReceipt };

  const cfg = await generatePreviewInline(sessionId, [`file://${filename}`], receiptStore);
  console.log('preview config saved:', cfg.previewUrl);
  console.log('preview file path:', path.join(process.cwd(), '.robby', 'previews', sessionId + '.json'));
}

demo().catch(e => { console.error(e); process.exit(1); });
