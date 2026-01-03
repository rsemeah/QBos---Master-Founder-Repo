import { describe, expect, test } from '@jest/globals';
import { createReceipt, verifyReceiptChain } from '../receipt';
import PostgresStore from '../store/postgresStore';

const ROOT_SESSION = 'integration_test_session_' + Math.random().toString(36).slice(2, 8);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('PostgresStore integration', () => {
  test('insert and retrieve receipts when Postgres available', async () => {
    const store = new PostgresStore();

    // try connect (retry a few times)
    let ok = false;
    for (let i = 0; i < 10; i++) {
      try {
        await (store as any).pool.query('SELECT 1');
        ok = true;
        break;
      } catch (e) {
        await sleep(500);
      }
    }

    if (!ok) {
      console.warn('Postgres not available on default host/port - skipping integration test');
      return;
    }

    // create a receipt using the library (requires ROBBY_RECEIPT_MAC_SECRET to be set)
    if (!process.env.ROBBY_RECEIPT_MAC_SECRET) {
      console.warn('ROBBY_RECEIPT_MAC_SECRET not set - skipping signed receipt flow');
      await store.close();
      return;
    }

    const r1 = await createReceipt({ sessionId: ROOT_SESSION, type: 'test.step', payload: { ok: true }, store });
    const r2 = await createReceipt({ sessionId: ROOT_SESSION, type: 'test.step', payload: { ok: true }, store });

    const last = await store.getLastReceiptForSession(ROOT_SESSION);
    expect(last).not.toBeNull();
    const receipts = await store.getReceiptsForSession(ROOT_SESSION);
    expect(receipts.length).toBeGreaterThanOrEqual(2);

    const chainOk = await verifyReceiptChain(receipts);
    expect(chainOk).toBe(true);

    await store.close();
  }, 30000);
});
