"use strict";
/**
 * Mock for @qbos/truthserum package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptReader = exports.ReceiptWriter = void 0;
class ReceiptWriter {
    write = jest.fn().mockResolvedValue({ id: 'receipt123', hash: 'hash123' });
}
exports.ReceiptWriter = ReceiptWriter;
class ReceiptReader {
    read = jest.fn().mockResolvedValue({ id: 'receipt123', verified: true });
}
exports.ReceiptReader = ReceiptReader;
//# sourceMappingURL=truthserum.js.map