import assert from "node:assert/strict";
import test from "node:test";
import { OrchestrationEngine } from "../orchestrator";
import { Receipt } from "@qbos/truthserum";
import { SilentEngine, MockProvider } from "@qbos/silent-engine-core";

type ReceiptInput = Omit<Receipt, "id" | "createdAt">;

class MemoryReceiptWriter {
  private receipts: Receipt[] = [];

  async writeReceipt(receipt: ReceiptInput): Promise<Receipt> {
    const fullReceipt: Receipt = {
      id: `receipt_${this.receipts.length + 1}`,
      createdAt: new Date(),
      ...receipt,
    };

    this.receipts.push(fullReceipt);
    return fullReceipt;
  }

  async readReceipts(sessionId?: string): Promise<Receipt[]> {
    if (!sessionId) {
      return [...this.receipts];
    }

    return this.receipts.filter((receipt) => receipt.sessionId === sessionId);
  }
}

function buildSilentEngine(): SilentEngine {
  const mockProvider = new MockProvider();
  mockProvider.configure({
    providerKey: "mock",
    apiKey: "mock-key-for-testing",
  });

  return new SilentEngine({
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

async function seedReadyReceipts(writer: MemoryReceiptWriter, sessionId: string) {
  const readyReceipts: ReceiptInput[] = [
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

test("routes AI generation through SilentEngine and emits routing metadata", async () => {
  const sessionId = "session-test-1";
  const writer = new MemoryReceiptWriter();
  await seedReadyReceipts(writer, sessionId);

  const orchestrator = new OrchestrationEngine(writer, buildSilentEngine());

  const result = await orchestrator.processAIMessage(
    {
      role: "user",
      content: "Hello SilentEngine",
    },
    {
      sessionId,
      userId: "user-123",
      receipts: [],
    }
  );

  assert.match(result.response, /Mock AI Response/);

  const receipts = await writer.readReceipts(sessionId);
  const silentReceipt = receipts.find((receipt) => receipt.type === "silent.generated");
  assert.ok(silentReceipt, "expected silent.generated receipt to be emitted");
  assert.equal(silentReceipt?.details.provider, "mock");
  assert.equal(silentReceipt?.details.model, "mock-standard");
});
