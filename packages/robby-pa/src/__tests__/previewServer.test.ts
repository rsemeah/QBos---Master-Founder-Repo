import { AddressInfo } from 'net';
import fetch from 'node-fetch';
import { generatePreview } from '../preview';
import app from '../previewServer';
import InMemoryStore from '../store/inMemoryStore';

describe('preview server', () => {
  const OLD = process.env.ROBBY_RECEIPT_MAC_SECRET;
  let server: any;
  beforeAll(async () => {
    process.env.ROBBY_RECEIPT_MAC_SECRET = 'test_secret_123';
    const store = new InMemoryStore();
    server = app.listen(0);
    // create preview config
    await generatePreview('test_session_preview', ['file:///tmp/doesnotexist'], { getLastReceiptForSession: store.getLastReceiptForSession.bind(store), insertReceipt: store.insertReceipt.bind(store) } as any);
  });

  afterAll(() => {
    process.env.ROBBY_RECEIPT_MAC_SECRET = OLD;
    server.close();
  });

  test('returns 401 without token', async () => {
    const addr = server.address() as AddressInfo;
    const res = await fetch(`http://localhost:${addr.port}/preview/test_session_preview/index.html`);
    expect(res.status).toBe(401);
  });
});
