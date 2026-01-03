"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const orchestrator_1 = require("../orchestrator");
const silent_engine_core_1 = require("@qbos/silent-engine-core");
class MemoryReceiptWriter {
    receipts = [];
    async writeReceipt(receipt) {
        const fullReceipt = {
            id: `receipt_${this.receipts.length + 1}`,
            createdAt: new Date(),
            ...receipt,
        };
        this.receipts.push(fullReceipt);
        return fullReceipt;
    }
    async readReceipts(sessionId) {
        if (!sessionId) {
            return [...this.receipts];
        }
        return this.receipts.filter((receipt) => receipt.sessionId === sessionId);
    }
}
function buildSilentEngine() {
    const mockProvider = new silent_engine_core_1.MockProvider();
    mockProvider.configure({
        providerKey: "mock",
        apiKey: "mock-key-for-testing",
    });
    return new silent_engine_core_1.SilentEngine({
        providers: [mockProvider],
        policies: [
            {
                policyKey: "default",
                displayName: "Runtime Default Policy",
                description: "Default routing policy for orchestration",
                preferredCapabilities: ["fastLatency", "lowCost"],
                requiredCapabilities: [],
                allowFallback: false,
                requireSafetyCheck: false,
                minSafetyLevel: "low",
            },
        ],
        defaultPolicyKey: "default",
    });
}
async function seedReadyReceipts(writer, sessionId) {
    const readyReceipts = [
        {
            sessionId,
            type: "identity.authenticated",
            details: { userId: "user-123" },
        },
        {
            sessionId,
            type: "billing.active",
            details: { plan: "starter" },
        },
        {
            sessionId,
            type: "session.created",
            details: { source: "test" },
        },
        {
            sessionId,
            type: "billing.cap_not_exceeded",
            details: { remaining: 100 },
        },
        {
            sessionId,
            type: "safety.passed",
            details: { scanner: "test" },
        },
    ];
    for (const receipt of readyReceipts) {
        await writer.writeReceipt(receipt);
    }
}
(0, node_test_1.default)("routes AI generation through SilentEngine and emits routing metadata", async () => {
    const sessionId = "session-test-1";
    const writer = new MemoryReceiptWriter();
    await seedReadyReceipts(writer, sessionId);
    const orchestrator = new orchestrator_1.OrchestrationEngine(writer, buildSilentEngine());
    const result = await orchestrator.processAIMessage({
        role: "user",
        content: "Hello SilentEngine",
    }, {
        sessionId,
        userId: "user-123",
        receipts: [],
    });
    strict_1.default.match(result.response, /Mock AI Response/);
    const receipts = await writer.readReceipts(sessionId);
    const silentReceipt = receipts.find((receipt) => receipt.type === "silent.generated");
    strict_1.default.ok(silentReceipt, "expected silent.generated receipt to be emitted");
    strict_1.default.equal(silentReceipt?.details.provider, "mock");
    strict_1.default.equal(silentReceipt?.details.model, "mock-standard");
});
//# sourceMappingURL=orchestrator.test.js.map