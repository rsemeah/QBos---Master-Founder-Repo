# Layer Verification Receipts

## Layer 0 - Truth & Intent Enforcement
apps/proof-harness/app/api/session/route.ts:    const sessionReceipt = receipts.find(r => r.type === 'session.created');
apps/proof-harness/app/api/session/route.ts:    if (!sessionReceipt) {
apps/proof-harness/app/api/session/route.ts:      ...sessionReceipt.details,
apps/proof-harness/app/api/jobs/process/route.ts:import { ReceiptWriter } from '@qbos/truthserum';
apps/proof-harness/app/api/jobs/process/route.ts:const receiptWriter = new ReceiptWriter(
apps/proof-harness/app/api/rob/message/route.ts: * - Receipt persistence (Memory)
apps/proof-harness/app/api/truth/evaluate/route.ts: * TruthSerum evaluation API
apps/proof-harness/app/api/truth/evaluate/route.ts:import { TruthSerum, ReceiptWriter, IntentsRegistry } from '@qbos/truthserum';
apps/proof-harness/app/api/truth/evaluate/route.ts:const receiptWriter = new ReceiptWriter({
apps/proof-harness/app/api/truth/evaluate/route.ts:    const receipts = await receiptWriter.readReceipts(sessionId);
apps/proof-harness/app/api/truth/evaluate/route.ts:    const evaluation = TruthSerum.evaluateIntent(intent, receipts);

603 matches
483 matched lines
47 files contained matches
146 files searched
52271 bytes printed
594515 bytes searched
0.054343 seconds spent searching
0.028987 seconds
