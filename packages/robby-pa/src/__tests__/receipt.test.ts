import { createReceipt, verifyReceipt, verifyReceiptChain } from '../receipt';
import InMemoryStore from '../store/inMemoryStore';

describe('receipt create/verify', () => {
  const OLD = process.env.ROBBY_RECEIPT_MAC_SECRET;
  beforeAll(() => {
    process.env.ROBBY_RECEIPT_MAC_SECRET = 'test_secret_123';
  });
  afterAll(() => {
    process.env.ROBBY_RECEIPT_MAC_SECRET = OLD;
  });

  test('create and verify single receipt', async () => {
    const store = new InMemoryStore();
    const rcpt = await createReceipt({
      sessionId: 's1',
      type: 'session.created',
      payload: { note: 't' },
      store: {
        getLastReceiptForSession: store.getLastReceiptForSession.bind(store),
        insertReceipt: store.insertReceipt.bind(store)
      }
    } as any);

    const ok = await verifyReceipt(rcpt as any);
    expect(ok).toBe(true);
  });

  test('chain verify', async () => {
    const store = new InMemoryStore();
    const r1 = await createReceipt({ sessionId: 's2', type: 'a', payload: {}, store: { getLastReceiptForSession: store.getLastReceiptForSession.bind(store), insertReceipt: store.insertReceipt.bind(store) } } as any);
    const r2 = await createReceipt({ sessionId: 's2', type: 'b', payload: {}, store: { getLastReceiptForSession: store.getLastReceiptForSession.bind(store), insertReceipt: store.insertReceipt.bind(store) } } as any);

    const receipts = await store.getReceiptsForSession('s2');
    const ok = await verifyReceiptChain(receipts as any);
    expect(ok).toBe(true);
  });
});
