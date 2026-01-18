import { MockProvider, SilentEngine } from "@qbos/silent-engine-core";
import { Receipt } from "@qbos/truthserum";
import { OrchestrationEngine } from "../orchestrator";

// Ensure TruthSerum evaluateIntent returns Verified for seeded
// receipts in these unit tests to avoid flakiness from import
// shape differences.
// jest.mock("@qbos/truthserum", () => {
//   const real = jest.requireActual("@qbos/truthserum");
//   return Object.assign({}, real, {
//     TruthSerum: {
//       evaluateIntent: jest.fn().mockImplementation((intent, receipts) => ({
//         intent,
//         state: "Verified",
//         missingProofs: [],
//         foundProofs: receipts || [],
//         nextSteps: [],
//       })),
//       computeOverallState: jest.fn().mockReturnValue("Verified"),
//       sanitizeClaims: jest
//         .fn()
//         .mockImplementation((text) => ({
//           sanitizedText: null,
//           missingProofs: [],
//         })),
//     },
//   });
// });

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

async function seedReadyReceipts(
  writer: MemoryReceiptWriter,
  sessionId: string,
) {
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

  const mockSerum = {
    evaluateIntent: (intent: any, receipts: any[]) => ({
      intent,
      state: "Verified",
      missingProofs: [],
      foundProofs: receipts || [],
      nextSteps: [],
    }),
    computeOverallState: (_: any) => "Verified",
    sanitizeClaims: (_text: string) => ({
      sanitizedText: null,
      missingProofs: [],
    }),
  };

  const orchestrator = new OrchestrationEngine(
    writer,
    buildSilentEngine(),
    mockSerum,
  );

  const result = await orchestrator.processAIMessage(
    {
      role: "user",
      content: "Hello SilentEngine",
    },
    {
      sessionId,
      userId: "user-123",
      receipts: [],
    },
  );

  // (debug logs removed)

  expect(result.response).toMatch(/Mock AI Response/);

  const receipts = await writer.readReceipts(sessionId);
  const silentReceipt = receipts.find(
    (receipt) => receipt.type === "silent.generated",
  );
  expect(silentReceipt).toBeDefined();
  expect(silentReceipt?.details.provider).toBe("mock");
  expect(silentReceipt?.details.model).toBe("mock-standard");
});
