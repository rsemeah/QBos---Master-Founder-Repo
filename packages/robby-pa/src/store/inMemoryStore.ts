import { Receipt } from '../receipt';

export class InMemoryStore {
  private receipts: Map<string, Receipt[]> = new Map();

  async getLastReceiptForSession(sessionId: string) {
    const arr = this.receipts.get(sessionId) || [];
    return arr.length ? arr[arr.length - 1] : null;
  }

  async insertReceipt(r: Receipt) {
    const arr = this.receipts.get(r.sessionId) || [];
    arr.push(r);
    this.receipts.set(r.sessionId, arr);
    return r;
  }

  async getReceiptsForSession(sessionId: string) {
    return this.receipts.get(sessionId) || [];
  }
}

export default InMemoryStore;
