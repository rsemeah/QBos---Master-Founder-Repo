/**
 * OrchestrationEngine - TruthSerum-first message processing
 * Emits receipts, evaluates intents, sanitizes responses
 */
import { Receipt, IntentEvaluation, TruthState } from "@qbos/truthserum";
import { RuntimeContext } from "./context";
import { SilentEngine } from "@qbos/silent-engine-core";
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
export declare class OrchestrationEngine {
    private receiptWriter;
    private silentEngine;
    constructor(receiptWriter: ReceiptWriterLike, silentEngine?: SilentEngine);
    /**
     * Process an AI message with TruthSerum verification
     * MUST evaluate session.ready intent before allowing generation
     */
    processAIMessage(message: AIMessage, context: RuntimeContext): Promise<ProcessResult>;
    /**
     * Generate a friendly response for Unknown state
     */
    private generateFriendlyUnknownResponse;
    /**
     * Generate draft AI response using SilentEngine routing
     */
    private generateDraftResponse;
    private createDefaultSilentEngine;
    /**
     * Emit a receipt manually (for external triggers)
     */
    emitReceipt(sessionId: string, type: string, details: Record<string, any>): Promise<Receipt>;
    /**
     * Read all receipts for a session
     */
    getReceipts(sessionId?: string): Promise<Receipt[]>;
}
export {};
//# sourceMappingURL=orchestrator.d.ts.map