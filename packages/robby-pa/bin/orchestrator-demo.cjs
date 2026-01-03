#!/usr/bin/env node
const { executeTask } = require('../dist/orchestrator');
const { InMemoryStore } = require('../dist/store/inMemoryStore');
const { createReceipt } = require('../dist/receipt');
const { getAdapter } = require('../dist/engines');

// If dist not built, fallback to src require via ts-node not available; try compiled path first
let orchestrator;
try { orchestrator = require('../dist/orchestrator'); } catch (e) { orchestrator = require('../src/orchestrator'); }
let engines;
try { engines = require('../dist/engines'); } catch (e) { engines = require('../src/engines'); }
let receiptLib;
try { receiptLib = require('../dist/receipt'); } catch (e) { receiptLib = require('../src/receipt'); }
let storeModule;
try { storeModule = require('../dist/store/inMemoryStore'); } catch (e) { storeModule = require('../src/store/inMemoryStore'); }

async function demo() {
  if (!process.env.ROBBY_RECEIPT_MAC_SECRET) {
    console.error('Set ROBBY_RECEIPT_MAC_SECRET env var first');
    process.exit(2);
  }

  const store = new storeModule.default();

  const receiptStore = {
    getLastReceiptForSession: store.getLastReceiptForSession.bind(store),
    insertReceipt: store.insertReceipt.bind(store)
  };

  const task = { id: 'task_demo_1', engine: 'SilentEngine', params: { prompt: 'generate plan' } };

  const orchestratorImpl = orchestrator.executeTask || orchestrator.default?.executeTask;

  const r = await orchestratorImpl('session_demo_1', task, receiptStore);
  console.log('execute result:', r.success);

  const receipts = await store.getReceiptsForSession('session_demo_1');
  console.log('receipts:', receipts.map(r => ({ seq: r.seq, type: r.type })));
}

demo().catch(err => { console.error(err); process.exit(1); });
