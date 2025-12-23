/**
 * OrchestrationEngine - TruthSerum-first message processing
 * Emits receipts, evaluates intents, sanitizes responses
 */

import {
  TruthSerum,
  Receipt,
  IntentEvaluation,
  TruthState,
  getIntent,
} from "@qbos/truthserum";
import { RuntimeContext } from "./context";
import { ReceiptWriter } from "@qbos/truthserum";

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
  private receiptWriter: ReceiptWriter;

  constructor(receiptWriter: ReceiptWriter) {
    this.receiptWriter = receiptWriter;
  }

  /**
   * Process an AI message with TruthSerum verification
   * MUST evaluate session.ready intent before allowing generation
   */
  async processAIMessage(
    message: AIMessage,
    context: RuntimeContext
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
    const allReceipts = await this.receiptWriter.readReceipts(context.sessionId);

    // Step 3: Evaluate session.ready intent
    const sessionReadyIntent = getIntent("session.ready");
    if (!sessionReadyIntent) {
      throw new Error("session.ready intent not found in registry");
    }

    const sessionEval = TruthSerum.evaluateIntent(sessionReadyIntent, allReceipts);

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
      ? TruthSerum.evaluateIntent(robReadyIntent, allReceipts)
      : { state: "Unknown" as TruthState, missingProofs: [], foundProofs: [], nextSteps: [] };

    if (robEval.state === "Blocked") {
      const blockReceipt = await this.receiptWriter.writeReceipt({
        sessionId: context.sessionId,
        type: "safety.blocked",
        details: { reason: "Rob evaluation blocked", evaluation: robEval },
      });
      newReceipts.push(blockReceipt);

      return {
        response: "I can't help with that right now. Your session is safe, but this request was blocked.",
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
    const draftResponse = await this.generateDraftResponse(message, context);

    const genReceipt = await this.receiptWriter.writeReceipt({
      sessionId: context.sessionId,
      type: "silent.generated",
      details: { 
        prompt: message.content, 
        response: draftResponse,
        provider: "mock", // Replace with actual provider
        model: "mock-model",
        tokensIn: 100,
        tokensOut: 200,
      },
    });
    newReceipts.push(genReceipt);

    // Step 7: Read receipts again (includes new ones)
    const updatedReceipts = [...allReceipts, ...newReceipts];

    // Step 8: Sanitize claims with TruthSerum
    const overallState = TruthSerum.computeOverallState([sessionEval, robEval]);
    const verdict = TruthSerum.sanitizeClaims(draftResponse, updatedReceipts, overallState);

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
  private generateFriendlyUnknownResponse(evaluation: IntentEvaluation): string {
    const missing = evaluation.missingProofs.map((p) => p.description).join(", ");
    return `I'm not quite ready yet. I need: ${missing}. Let's get that sorted first!`;
  }

  /**
   * Generate draft AI response (placeholder - integrate SilentEngine here)
   */
  private async generateDraftResponse(
    message: AIMessage,
    context: RuntimeContext
  ): Promise<string> {
    // TODO: Integrate SilentEngine for real AI generation
    // For now, return a mock response
    return `Thanks for your message! I'm here to help you build. Your session is ${context.sessionId}.`;
  }

  /**
   * Emit a receipt manually (for external triggers)
   */
  async emitReceipt(
    sessionId: string,
    type: string,
    details: Record<string, any>
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
