// Node script to append a sample receipt using packages/truthserum ReceiptWriter
// Usage: node scripts/write-sample-receipt.js

const { ReceiptWriter } = require('../packages/truthserum/src/ReceiptWriter');

async function run() {
  const writer = new ReceiptWriter({ localFallbackPath: './proof/local_receipts.jsonl' });

  const receipt = await writer.writeReceipt({
    sessionId: 'integration-session-1',
    type: 'ui.sample_written',
    details: { info: 'Sample receipt written by script' },
  });

  console.log('Wrote receipt:', receipt.id);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
