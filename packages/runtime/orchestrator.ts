/**
 * OrchestrationEngine - TruthSerum-first message processing
 * Emits receipts, evaluates intents, sanitizes responses
 */

import { MockProvider, SilentEngine } from "@qbos/silent-engine-core";
import {
    IntentEvaluation,
    Receipt,
    TruthSerum,
    TruthState,
    getIntent,
} from "@qbos/truthserum";
import { RuntimeContext } from "./context";

type ReceiptWriterLike = Pick<ReceiptWriter, "writeReceipt" | "readReceipts">;

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, any>;
}

export interface ProcessResult {
  response: string;
  truthState: TruthState;
  evaluations: IntentEvaluation[];
  newReceipts: Receipt[];
  sanitized: boolean;
}

export class OrchestrationEngine {
  private receiptWriter: ReceiptWriterLike;
  private silentEngine: SilentEngine;
  private serum: any;

  constructor(
    receiptWriter: ReceiptWriterLike,
    silentEngine?: SilentEngine,
    serum?: any,
  ) {
    this.receiptWriter = receiptWriter;
    this.silentEngine = silentEngine ?? this.createDefaultSilentEngine();
    // Allow injecting a TruthSerum-like object for tests; fall back
    // to the package export when not provided.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg: any = require("@qbos/truthserum");
    this.serum =
      (serum ?? (TruthSerum as any) ?? pkg.TruthSerum) ||
      pkg.default?.TruthSerum;
  }

  /**
   * Process an AI message with TruthSerum verification
   * MUST evaluate session.ready intent before allowing generation
   */
  async processAIMessage(
    message: AIMessage,
    context: RuntimeContext,
  ): Promise<ProcessResult> {
    const newReceipts: Receipt[] = [];

    // Step 1: Emit receipt for user message
    if (message.role === "user") {
      const msgReceipt = await this.receiptWriter.writeReceipt({
        sessionId: context.sessionId,
        type: "user.message_received",
        details: { content: message.content },
      });
      newReceipts.push(msgReceipt);
    }

    // Step 2: Read all receipts for this session
    const allReceipts = await this.receiptWriter.readReceipts(
      context.sessionId,
    );

    // Step 3: Evaluate session.ready intent
    const sessionReadyIntent = getIntent("session.ready");
    if (!sessionReadyIntent) {
      throw new Error("session.ready intent not found in registry");
    }

    // Support environments where `TruthSerum` may be a named import
    // or only available on the package default; fall back to the
    // runtime package export when necessary.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sessionEval = this.serum.evaluateIntent(
      sessionReadyIntent,
      allReceipts,
    );

    // Step 4: If not Verified, return truthful response + missing proof list
    if (sessionEval.state !== "Verified") {
      const response = this.generateFriendlyUnknownResponse(sessionEval);
      return {
        response,
        truthState: "Unknown",
        evaluations: [sessionEval],
        newReceipts,
        sanitized: false,
      };
    }

    // Step 5: Evaluate rob.ready intent (billing caps, safety)
    const robReadyIntent = getIntent("rob.ready");
    const robEval = robReadyIntent
      ? this.serum.evaluateIntent(robReadyIntent, allReceipts)
      : {
          state: "Unknown" as TruthState,
          missingProofs: [],
          foundProofs: [],
          nextSteps: [],
        };

    if (robEval.state === "Blocked") {
      const blockReceipt = await this.receiptWriter.writeReceipt({
        sessionId: context.sessionId,
        type: "safety.blocked",
        details: { reason: "Rob evaluation blocked", evaluation: robEval },
      });
      newReceipts.push(blockReceipt);

      return {
        response:
          "I can't help with that right now. Your session is safe, but this request was blocked.",
        truthState: "Blocked",
        evaluations: [sessionEval, robEval],
        newReceipts,
        sanitized: false,
      };
    }

    if (robEval.state === "Unknown") {
      // Emit receipts for missing proofs to guide next steps
      const warningReceipt = await this.receiptWriter.writeReceipt({
        sessionId: context.sessionId,
        type: "billing.cap_warning",
        details: { message: "Missing rob.ready proofs", evaluation: robEval },
      });
      newReceipts.push(warningReceipt);

      const response = this.generateFriendlyUnknownResponse(robEval);
      return {
        response,
        truthState: "Unknown",
        evaluations: [sessionEval, robEval],
        newReceipts,
        sanitized: false,
      };
    }

    // Step 6: Generate draft response (silent.generate emission happens here)
    const draftGeneration = await this.generateDraftResponse(message, context);
    const draftResponse = draftGeneration.text;

    const genReceipt = await this.receiptWriter.writeReceipt({
      sessionId: context.sessionId,
      type: "silent.generated",
      details: {
        prompt: message.content,
        response: draftResponse,
        provider: draftGeneration.provider,
        model: draftGeneration.model,
        tokensIn: draftGeneration.tokensIn,
        tokensOut: draftGeneration.tokensOut,
        requestId: draftGeneration.requestId,
        latencyMs: draftGeneration.latencyMs,
        costUsd: draftGeneration.cost,
      },
    });
    newReceipts.push(genReceipt);

    // Step 7: Read receipts again (includes new ones)
    const updatedReceipts = [...allReceipts, ...newReceipts];

    // Step 8: Sanitize claims with TruthSerum
    const overallState = this.serum.computeOverallState([sessionEval, robEval]);
    const verdict = this.serum.sanitizeClaims(
      draftResponse,
      updatedReceipts,
      overallState,
    );

    const finalResponse = verdict.sanitizedText || draftResponse;
    const wasSanitized = Boolean(verdict.sanitizedText);

    if (wasSanitized) {
      const sanitizeReceipt = await this.receiptWriter.writeReceipt({
        sessionId: context.sessionId,
        type: "claim.sanitized",
        details: {
          original: draftResponse,
          sanitized: finalResponse,
          missingProofs: verdict.missingProofs,
        },
      });
      newReceipts.push(sanitizeReceipt);
    }

    // Step 9: Emit state transition if needed
    if (context.currentState) {
      const transitionReceipt = await this.receiptWriter.writeReceipt({
        sessionId: context.sessionId,
        type: "state.transition",
        details: {
          fromState: context.currentState,
          toState: "LISTENING",
          reason: "Processed AI message",
        },
      });
      newReceipts.push(transitionReceipt);
    }

    return {
      response: finalResponse,
      truthState: overallState,
      evaluations: [sessionEval, robEval],
      newReceipts,
      sanitized: wasSanitized,
    };
  }

  /**
   * Generate a friendly response for Unknown state
   */
  private generateFriendlyUnknownResponse(
    evaluation: IntentEvaluation,
  ): string {
    const missing = evaluation.missingProofs
      .map((p) => p.description)
      .join(", ");
    return `I'm not quite ready yet. I need: ${missing}. Let's get that sorted first!`;
  }

  /**
   * Generate draft AI response using SilentEngine routing
   */
  private async generateDraftResponse(
    message: AIMessage,
    context: RuntimeContext,
  ): Promise<{
    text: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    requestId: string;
    latencyMs: number;
    cost: number;
  }> {
    const result = await this.silentEngine.generate({
      messages: [
        {
          role: message.role,
          content: message.content,
        },
      ],
      userId: context.userId,
      orgId: context.appConfig?.orgId,
      maxCost: context.appConfig?.maxCost,
      preferredCapabilities: context.appConfig?.preferredCapabilities,
      systemPrompt: context.appConfig?.systemPrompt,
      requireSafetyCheck: context.appConfig?.requireSafetyCheck,
    });

    return {
      text: result.response.text,
      provider: result.provider,
      model: result.model,
      tokensIn: result.response.tokensInput,
      tokensOut: result.response.tokensOutput,
      requestId: result.requestId,
      latencyMs: result.totalLatencyMs,
      cost: result.actualCost,
    };
  }

  private createDefaultSilentEngine(): SilentEngine {
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

  /**
   * Emit a receipt manually (for external triggers)
   */
  async emitReceipt(
    sessionId: string,
    type: string,
    details: Record<string, any>,
  ): Promise<Receipt> {
    return this.receiptWriter.writeReceipt({
      sessionId,
      type,
      details,
    });
  }

  /**
   * Read all receipts for a session
   */
  async getReceipts(sessionId?: string): Promise<Receipt[]> {
    return this.receiptWriter.readReceipts(sessionId);
  }
}
