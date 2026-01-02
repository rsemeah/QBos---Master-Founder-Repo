/**
 * Mock for @qbos/truthserum package
 */

export class ReceiptWriter {
  write = jest.fn().mockResolvedValue({ id: 'receipt123', hash: 'hash123' });
}

export class ReceiptReader {
  read = jest.fn().mockResolvedValue({ id: 'receipt123', verified: true });
}
