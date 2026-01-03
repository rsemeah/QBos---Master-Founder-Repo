/**
 * SupabaseRobPersistence - Supabase adapter for RobEngine
 *
 * Implements RobEnginePersistence interface with Supabase backend.
 */
import type { RobEnginePersistence, RobSession, RobMessage, StateTransition, ConfigChange, UndoSnapshot, AIUsageRecord } from './RobEngine';
import type { Receipt } from './receipts/ReceiptSystem';
export declare class SupabaseRobPersistence implements RobEnginePersistence {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
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
    private generateId;
}
//# sourceMappingURL=SupabaseRobPersistence.d.ts.map