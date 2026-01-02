import keystore from '../packages/truthserum/src/keystore';
import ReceiptWriter from '../packages/truthserum/src/ReceiptWriter';

async function run() {
  try {
    console.log('Initializing keystore...');
    keystore.init();

    console.log('Creating ReceiptWriter instance...');
    const writer = ReceiptWriter;

    console.log('Writing signed receipt (local fallback expected)...');
    const receipt = await writer.writeReceipt({
      sessionId: 'smoke-test',
      type: 'smoke.test',
      details: { message: 'hello truthserum', ts: new Date().toISOString() }
    } as any);

    console.log('Signed receipt:');
    console.log(JSON.stringify(receipt, null, 2));

    console.log('Verifying receipt...');
    const ok = await writer.verifyReceipt(receipt as any);
    console.log('Verification result:', ok);

    console.log('If using local fallback, sample file: proof/local_receipts.jsonl');
  } catch (e) {
    console.error('Smoke test failed:', e);
    process.exit(2);
  }
}

run();
