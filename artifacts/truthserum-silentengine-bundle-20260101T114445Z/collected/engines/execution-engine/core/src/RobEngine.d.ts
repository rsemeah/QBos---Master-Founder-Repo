/**
 * RobEngine™ - The QuietBuilder State Machine
 *
 * TRUTH: Rob is the user-facing mediator to the constitutional framework.
 * All state transitions emit receipts. Progress ≠ Readiness.
 *
 * Constitutional Compliance: Required
 * Intelligence Enforcement: MANDATORY
 */
import { ReceiptSystem, Receipt } from './receipts/ReceiptSystem';
import { type PreviewResult } from './intelligence/PreviewGenerator';
import type { IntelligenceReceipt } from './intelligence/IntelligenceContract';
export type RobState = 'INIT' | 'WAITING' | 'LISTENING' | 'CLARIFYING' | 'CONFIRMING' | 'BUILDING' | 'VERIFYING' | 'READY' | 'BLOCKED' | 'UNKNOWN' | 'VIEW_ONLY' | 'DEFERRED' | 'PUBLISHED';
export type ReadinessTier = 'draft' | 'shaped' | 'viable' | 'ready' | 'published';
export interface RobSession {
    id: string;
    user_id: string;
    template_id: string;
    app_name?: string;
    progress_percent: number;
    readiness_tier: ReadinessTier;
    current_state: RobState;
    app_config: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface RobMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: Record<string, unknown>;
    created_at: string;
}
export interface StateTransition {
    from_state: RobState;
    to_state: RobState;
    reason: string;
    triggered_by_message_id?: string;
}
export interface ConfigChange {
    key: string;
    old_value: unknown;
    new_value: unknown;
    changed_by_message_id?: string;
}
export interface UndoSnapshot {
    action_type: string;
    snapshot: Record<string, unknown>;
}
export interface AIUsageRecord {
    session_id: string;
    triggered_by_message_id: string;
    provider: string;
    model: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    latency_ms: number;
}
export interface RobEnginePersistence {
    createSession(session: Omit<RobSession, 'id' | 'created_at' | 'updated_at'>): Promise<RobSession>;
    getSession(sessionId: string): Promise<RobSession | null>;
    updateSession(sessionId: string, updates: Partial<RobSession>): Promise<RobSession>;
    addMessage(message: Omit<RobMessage, 'id' | 'created_at'>): Promise<RobMessage>;
    getMessages(sessionId: string): Promise<RobMessage[]>;
    addReceipt(receipt: Omit<Receipt, 'receipt_id' | 'timestamp'>): Promise<Receipt>;
    getReceipts(sessionId: string): Promise<Receipt[]>;
    addStateTransition(sessionId: string, transition: StateTransition): Promise<void>;
    getStateTransitions(sessionId: string): Promise<StateTransition[]>;
    addConfigChange(sessionId: string, change: ConfigChange): Promise<void>;
    getConfigHistory(sessionId: string): Promise<ConfigChange[]>;
    pushUndoSnapshot(sessionId: string, snapshot: UndoSnapshot): Promise<void>;
    popUndoSnapshot(sessionId: string): Promise<UndoSnapshot | null>;
    recordAIUsage(usage: AIUsageRecord): Promise<void>;
    getAIUsageToday(userId: string): Promise<{
        messages_today: number;
        tokens_used: number;
        cost_today: number;
    }>;
}
export declare class RobEngine {
    private receiptSystem;
    private truthSerum;
    private ideaDecomposer;
    private previewGenerator;
    private persistence?;
    constructor(persistence?: RobEnginePersistence);
    /**
     * Create a new Rob session
     */
    createSession(userId: string, templateId: string): Promise<RobSession>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Promise<RobSession | null>;
    /**
     * Transition session state
     */
    transitionState(sessionId: string, toState: RobState, reason: string, triggeredByMessageId?: string): Promise<void>;
    /**
     * Validate state transition (basic rules)
     */
    private validateStateTransition;
    /**
     * Update session configuration
     */
    updateConfig(sessionId: string, key: string, value: unknown, changedByMessageId?: string): Promise<void>;
    /**
     * Compute progress percentage (0-100)
     * Based on completed steps, NOT readiness
     */
    computeProgress(sessionId: string): Promise<number>;
    /**
     * Compute readiness tier based on gate receipts
     */
    computeReadiness(sessionId: string): Promise<ReadinessTier>;
    /**
     * Update progress and readiness for a session
     */
    updateProgressAndReadiness(sessionId: string): Promise<void>;
    /**
     * Push undo snapshot
     */
    pushUndoSnapshot(sessionId: string, actionType: string, snapshot: Record<string, unknown>): Promise<void>;
    /**
     * Undo last action
     */
    undoLast(sessionId: string): Promise<UndoSnapshot | null>;
    /**
     * Validate session receipts with TruthSerum
     */
    validateSession(sessionId: string): Promise<import("./receipts/TruthSerumValidator").TruthSerumReport>;
    /**
     * STEP 1: Decompose user prompt into intelligence receipts
     *
     * This is the FIRST step when processing any build request.
     * Generates the required intelligence receipts that prove Rob is thinking.
     */
    decomposeIdea(sessionId: string, messageId: string, userPrompt: string): Promise<IntelligenceReceipt[]>;
    /**
     * STEP 1.5: Generate living preview (optional standalone call)
     */
    generatePreview(sessionId: string, messageId: string, intelligenceReceipts: IntelligenceReceipt[]): Promise<PreviewResult>;
    /**
     * STEP 2: Process Build Request (with intelligence receipts)
     *
     * MECHANICAL LAW: This operation REQUIRES intelligence receipts.
     * - idea.decomposed
     * - concept.inferred
     * - direction.recommended
     *
     * Failure to provide these receipts = BLOCKED state
     */
    processBuildRequest(sessionId: string, userPrompt: string, intelligenceReceipts: IntelligenceReceipt[]): Promise<{
        success: boolean;
        message: string;
        state: RobState;
        preview?: PreviewResult;
    }>;
    /**
     * Execute build (internal - only called after intelligence guard passes)
     */
    private executeBuild;
    /**
     * FORBIDDEN: Update session without intelligence
     *
     * Title-only updates are BLOCKED by mechanical law
     */
    updateSessionMetadata(sessionId: string, updates: Partial<Pick<RobSession, 'app_name' | 'template_id'>>, intelligenceReceipts: IntelligenceReceipt[]): Promise<void>;
    private generateId;
    /**
     * Get receipt system (for external access)
     */
    getReceiptSystem(): ReceiptSystem;
}
//# sourceMappingURL=RobEngine.d.ts.map