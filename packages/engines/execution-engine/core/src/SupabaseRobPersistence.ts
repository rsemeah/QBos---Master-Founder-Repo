/**
 * SupabaseRobPersistence - Supabase adapter for RobEngine
 * 
 * Implements RobEnginePersistence interface with Supabase backend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  RobEnginePersistence,
  RobSession,
  RobMessage,
  StateTransition,
  ConfigChange,
  UndoSnapshot,
  AIUsageRecord,
} from './RobEngine';
import type { Receipt } from './receipts/ReceiptSystem';

export class SupabaseRobPersistence implements RobEnginePersistence {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ==========================================================================
  // SESSIONS
  // ==========================================================================

  async createSession(session: Omit<RobSession, 'id' | 'created_at' | 'updated_at'>): Promise<RobSession> {
    const { data, error } = await this.supabase
      .from('rob_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return data as RobSession;
  }

  async getSession(sessionId: string): Promise<RobSession | null> {
    const { data, error } = await this.supabase
      .from('rob_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data as RobSession | null;
  }

  async updateSession(sessionId: string, updates: Partial<RobSession>): Promise<RobSession> {
    const { data, error } = await this.supabase
      .from('rob_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update session: ${error.message}`);
    return data as RobSession;
  }

  // ==========================================================================
  // MESSAGES
  // ==========================================================================

  async addMessage(message: Omit<RobMessage, 'id' | 'created_at'>): Promise<RobMessage> {
    const { data, error } = await this.supabase
      .from('rob_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw new Error(`Failed to add message: ${error.message}`);
    return data as RobMessage;
  }

  async getMessages(sessionId: string): Promise<RobMessage[]> {
    const { data, error } = await this.supabase
      .from('rob_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get messages: ${error.message}`);
    return data as RobMessage[];
  }

  // ==========================================================================
  // RECEIPTS
  // ==========================================================================

  async addReceipt(receipt: Omit<Receipt, 'receipt_id' | 'timestamp'>): Promise<Receipt> {
    const fullReceipt: Receipt = {
      ...receipt,
      receipt_id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('rob_receipts')
      .insert({
        id: fullReceipt.receipt_id,
        session_id: fullReceipt.session_id,
        type: fullReceipt.action_type,
        details: {
          actor: fullReceipt.actor,
          outcome: fullReceipt.outcome,
          evidence_refs: fullReceipt.evidence_refs,
          truth_state: fullReceipt.truth_state,
          metadata: fullReceipt.metadata,
          parent_receipt_id: fullReceipt.parent_receipt_id,
        },
        caused_by_message_id: fullReceipt.metadata?.triggered_by_message_id || null,
        caused_by_rule: fullReceipt.metadata?.rule || null,
        caused_by_constraint: fullReceipt.metadata?.constraint || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add receipt: ${error.message}`);

    return {
      receipt_id: data.id,
      session_id: data.session_id,
      timestamp: data.created_at,
      actor: (data.details as any).actor,
      action_type: data.type,
      outcome: (data.details as any).outcome,
      evidence_refs: (data.details as any).evidence_refs,
      truth_state: (data.details as any).truth_state,
      metadata: (data.details as any).metadata,
      parent_receipt_id: (data.details as any).parent_receipt_id,
    };
  }

  async getReceipts(sessionId: string): Promise<Receipt[]> {
    const { data, error } = await this.supabase
      .from('rob_receipts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get receipts: ${error.message}`);

    return data.map((row) => ({
      receipt_id: row.id,
      session_id: row.session_id,
      timestamp: row.created_at,
      actor: (row.details as any).actor,
      action_type: row.type,
      outcome: (row.details as any).outcome,
      evidence_refs: (row.details as any).evidence_refs,
      truth_state: (row.details as any).truth_state,
      metadata: (row.details as any).metadata,
      parent_receipt_id: (row.details as any).parent_receipt_id,
    }));
  }

  // ==========================================================================
  // STATE TRANSITIONS
  // ==========================================================================

  async addStateTransition(sessionId: string, transition: StateTransition): Promise<void> {
    const { error } = await this.supabase.from('rob_state_transitions').insert({
      session_id: sessionId,
      from_state: transition.from_state,
      to_state: transition.to_state,
      reason: transition.reason,
      triggered_by_message_id: transition.triggered_by_message_id || null,
    });

    if (error) throw new Error(`Failed to add state transition: ${error.message}`);
  }

  async getStateTransitions(sessionId: string): Promise<StateTransition[]> {
    const { data, error } = await this.supabase
      .from('rob_state_transitions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get state transitions: ${error.message}`);

    return data.map((row) => ({
      from_state: row.from_state,
      to_state: row.to_state,
      reason: row.reason,
      triggered_by_message_id: row.triggered_by_message_id || undefined,
    }));
  }

  // ==========================================================================
  // CONFIG HISTORY
  // ==========================================================================

  async addConfigChange(sessionId: string, change: ConfigChange): Promise<void> {
    const { error } = await this.supabase.from('rob_config_history').insert({
      session_id: sessionId,
      key: change.key,
      old_value: change.old_value,
      new_value: change.new_value,
      changed_by_message_id: change.changed_by_message_id || null,
    });

    if (error) throw new Error(`Failed to add config change: ${error.message}`);
  }

  async getConfigHistory(sessionId: string): Promise<ConfigChange[]> {
    const { data, error } = await this.supabase
      .from('rob_config_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get config history: ${error.message}`);

    return data.map((row) => ({
      key: row.key,
      old_value: row.old_value,
      new_value: row.new_value,
      changed_by_message_id: row.changed_by_message_id || undefined,
    }));
  }

  // ==========================================================================
  // UNDO STACK
  // ==========================================================================

  async pushUndoSnapshot(sessionId: string, snapshot: UndoSnapshot): Promise<void> {
    const { error } = await this.supabase.from('rob_undo_stack').insert({
      session_id: sessionId,
      action_type: snapshot.action_type,
      snapshot: snapshot.snapshot,
    });

    if (error) throw new Error(`Failed to push undo snapshot: ${error.message}`);
  }

  async popUndoSnapshot(sessionId: string): Promise<UndoSnapshot | null> {
    // Get the most recent snapshot
    const { data: snapshots, error: fetchError } = await this.supabase
      .from('rob_undo_stack')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw new Error(`Failed to fetch undo snapshot: ${fetchError.message}`);
    if (!snapshots || snapshots.length === 0) return null;

    const snapshot = snapshots[0];

    // Delete it
    const { error: deleteError } = await this.supabase
      .from('rob_undo_stack')
      .delete()
      .eq('id', snapshot.id);

    if (deleteError) throw new Error(`Failed to delete undo snapshot: ${deleteError.message}`);

    return {
      action_type: snapshot.action_type,
      snapshot: snapshot.snapshot as Record<string, unknown>,
    };
  }

  // ==========================================================================
  // AI USAGE
  // ==========================================================================

  async recordAIUsage(usage: AIUsageRecord): Promise<void> {
    const { error } = await this.supabase.from('rob_ai_usage').insert({
      session_id: usage.session_id,
      triggered_by_message_id: usage.triggered_by_message_id,
      provider: usage.provider,
      model: usage.model,
      tokens_in: usage.tokens_in,
      tokens_out: usage.tokens_out,
      cost_usd: usage.cost_usd,
      latency_ms: usage.latency_ms,
    });

    if (error) throw new Error(`Failed to record AI usage: ${error.message}`);
  }

  async getAIUsageForSession(sessionId: string): Promise<AIUsageRecord[]> {
    const { data, error } = await this.supabase
      .from('rob_ai_usage')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get AI usage: ${error.message}`);

    return data.map((row) => ({
      session_id: row.session_id,
      triggered_by_message_id: row.triggered_by_message_id,
      provider: row.provider,
      model: row.model,
      tokens_in: row.tokens_in,
      tokens_out: row.tokens_out,
      cost_usd: row.cost_usd,
      latency_ms: row.latency_ms,
    }));
  }

  async getAIUsageToday(userId: string): Promise<{
    messages_today: number;
    tokens_used: number;
    cost_today: number;
  }> {
    const { data, error } = await this.supabase.rpc('get_rob_ai_usage_today', {
      p_user_id: userId,
    });

    if (error) throw new Error(`Failed to get AI usage: ${error.message}`);

    return {
      messages_today: data[0]?.messages_today || 0,
      tokens_used: data[0]?.tokens_used || 0,
      cost_today: data[0]?.cost_today || 0,
    };
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private generateId(): string {
    // UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
