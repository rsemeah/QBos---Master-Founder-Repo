/* Mock for @qbos/truthserum */
exports.IntentsRegistry = {};
// Populate commonly-used intents for tests
exports.IntentsRegistry["session.ready"] = {
  name: "session.ready",
  description: "Session is ready for interaction",
};
exports.IntentsRegistry["rob.ready"] = {
  name: "rob.ready",
  description: "Rob ready for generation",
};
exports.ReceiptWriter = function () {
  return {
    writeReceipt: jest.fn().mockResolvedValue({ id: "r1" }),
    readReceipts: jest.fn().mockResolvedValue([]),
  };
};

exports.getIntent = function (name) {
  return exports.IntentsRegistry[name];
};

exports.default = {
  IntentsRegistry: exports.IntentsRegistry,
  ReceiptWriter: exports.ReceiptWriter,
  getIntent: exports.getIntent,
};
("use strict");
/**
 * Mock for @qbos/truthserum package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptReader = exports.ReceiptWriter = void 0;
class ReceiptWriter {
  write = jest.fn().mockResolvedValue({ id: "receipt123", hash: "hash123" });
}
exports.ReceiptWriter = ReceiptWriter;
class ReceiptReader {
  read = jest.fn().mockResolvedValue({ id: "receipt123", verified: true });
}
exports.ReceiptReader = ReceiptReader;
//# sourceMappingURL=truthserum.js.map
// Provide a TruthSerum facade used by runtime/orchestrator
exports.TruthSerum = {
  evaluateIntent: jest.fn().mockImplementation((intent, receipts) => {
    // Default to Verified for session.ready in tests
    return {
      state: "Verified",
      missingProofs: [],
      foundProofs: [],
      nextSteps: [],
    };
  }),
  computeOverallState: jest.fn().mockReturnValue("Verified"),
  sanitizeClaims: jest.fn().mockImplementation((text) => ({
    sanitizedText: null,
    missingProofs: [],
  })),
};

// Export helpers for compatibility
exports.default = Object.assign(exports.default || {}, {
  TruthSerum: exports.TruthSerum,
  getIntent: exports.getIntent,
});
