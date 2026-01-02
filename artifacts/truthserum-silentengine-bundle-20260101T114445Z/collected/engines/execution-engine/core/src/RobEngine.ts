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
import { TruthSerumValidator } from './receipts/TruthSerumValidator';
import { IntelligenceGuard } from './intelligence/IntelligenceGuard';
import { IdeaDecomposer } from './intelligence/IdeaDecomposer';
import { PreviewGenerator, type PreviewResult } from './intelligence/PreviewGenerator';
import type { IntelligenceReceipt } from './intelligence/IntelligenceContract';
import { IntelligenceViolationError } from './intelligence/IntelligenceContract';

// ============================================================================
// TYPES
// ============================================================================

export type RobState =
  | 'INIT'
  | 'WAITING'
  | 'LISTENING'
  | 'CLARIFYING'
  | 'CONFIRMING'
  | 'BUILDING'
  | 'VERIFYING'
  | 'READY'
  | 'BLOCKED'
  | 'UNKNOWN'
  | 'VIEW_ONLY'
  | 'DEFERRED'
  | 'PUBLISHED';

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

// ============================================================================
// ROB ENGINE
// ============================================================================

export interface RobEnginePersistence {
  // Sessions
  createSession(session: Omit<RobSession, 'id' | 'created_at' | 'updated_at'>): Promise<RobSession>;
  getSession(sessionId: string): Promise<RobSession | null>;
  updateSession(sessionId: string, updates: Partial<RobSession>): Promise<RobSession>;
  
  // Messages
  addMessage(message: Omit<RobMessage, 'id' | 'created_at'>): Promise<RobMessage>;
  getMessages(sessionId: string): Promise<RobMessage[]>;
  
  // Receipts
  addReceipt(receipt: Omit<Receipt, 'receipt_id' | 'timestamp'>): Promise<Receipt>;
  getReceipts(sessionId: string): Promise<Receipt[]>;
  
  // State Transitions
  addStateTransition(sessionId: string, transition: StateTransition): Promise<void>;
  getStateTransitions(sessionId: string): Promise<StateTransition[]>;
  
  // Config History
  addConfigChange(sessionId: string, change: ConfigChange): Promise<void>;
  getConfigHistory(sessionId: string): Promise<ConfigChange[]>;
  
  // Undo Stack
  pushUndoSnapshot(sessionId: string, snapshot: UndoSnapshot): Promise<void>;
  popUndoSnapshot(sessionId: string): Promise<UndoSnapshot | null>;
  
  // AI Usage
  recordAIUsage(usage: AIUsageRecord): Promise<void>;
  getAIUsageToday(userId: string): Promise<{ messages_today: number; tokens_used: number; cost_today: number }>;
}

export class RobEngine {
  private receiptSystem: ReceiptSystem;
  private truthSerum: TruthSerumValidator;
  private ideaDecomposer: IdeaDecomposer;
  private previewGenerator: PreviewGenerator;
  private persistence?: RobEnginePersistence;

  constructor(persistence?: RobEnginePersistence) {
    this.receiptSystem = new ReceiptSystem();
    this.truthSerum = new TruthSerumValidator();
    this.ideaDecomposer = new IdeaDecomposer();
    this.previewGenerator = new PreviewGenerator();
    this.persistence = persistence;
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new Rob session
   */
  async createSession(userId: string, templateId: string): Promise<RobSession> {
    const session: Omit<RobSession, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      template_id: templateId,
      progress_percent: 0,
      readiness_tier: 'draft',
      current_state: 'INIT',
      app_config: {},
    };

    let persistedSession: RobSession;
    if (this.persistence) {
      persistedSession = await this.persistence.createSession(session);
    } else {
      // In-memory fallback
      persistedSession = {
        ...session,
        id: this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Emit receipt
    const receipt = this.receiptSystem.emit({
      session_id: persistedSession.id,
      actor: 'rob',
      action_type: 'session.created',
      outcome: 'success',
      evidence_refs: [],
      truth_state: 'Verified',
      metadata: { user_id: userId, template_id: templateId },
    });

    if (this.persistence) {
      await this.persistence.addReceipt(receipt);
    }

    // Transition to WAITING
    await this.transitionState(persistedSession.id, 'WAITING', 'Session initialized');

    return persistedSession;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<RobSession | null> {
    if (!this.persistence) {
      throw new Error('Persistence layer required for getSession');
    }
    return this.persistence.getSession(sessionId);
  }

  // ==========================================================================
  // STATE MACHINE
  // ==========================================================================

  /**
   * Transition session state
   */
  async transitionState(
    sessionId: string,
    toState: RobState,
    reason: string,
    triggeredByMessageId?: string
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fromState = session.current_state;

    // Validate transition (basic validation)
    this.validateStateTransition(fromState, toState);

    // Update session
    if (this.persistence) {
      await this.persistence.updateSession(sessionId, {
        current_state: toState,
      });
    }

    // Record transition
    const transition: StateTransition = {
      from_state: fromState,
      to_state: toState,
      reason,
      triggered_by_message_id: triggeredByMessageId,
    };

    if (this.persistence) {
      await this.persistence.addStateTransition(sessionId, transition);
    }

    // Emit receipt
    const receipt = this.receiptSystem.emit({
      session_id: sessionId,
      actor: 'rob',
      action_type: 'state.transition',
      outcome: 'success',
      evidence_refs: [],
      truth_state: 'Verified',
      metadata: transition as unknown as Record<string, unknown>,
    });

    if (this.persistence) {
      await this.persistence.addReceipt(receipt);
    }
  }

  /**
   * Validate state transition (basic rules)
   */
  private validateStateTransition(from: RobState, to: RobState): void {
    // PUBLISHED is terminal (cannot transition out)
    if (from === 'PUBLISHED' && to !== 'PUBLISHED') {
      throw new Error('Cannot transition from PUBLISHED state');
    }

    // BLOCKED can go to any state (recovery)
    if (from === 'BLOCKED') {
      return;
    }

    // Add more validation rules as needed
  }

  // ==========================================================================
  // CONFIG MANAGEMENT
  // ==========================================================================

  /**
   * Update session configuration
   */
  async updateConfig(
    sessionId: string,
    key: string,
    value: unknown,
    changedByMessageId?: string
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const oldValue = session.app_config[key];
    const newConfig = { ...session.app_config, [key]: value };

    // Update session
    if (this.persistence) {
      await this.persistence.updateSession(sessionId, {
        app_config: newConfig,
      });
    }

    // Record config change
    const change: ConfigChange = {
      key,
      old_value: oldValue,
      new_value: value,
      changed_by_message_id: changedByMessageId,
    };

    if (this.persistence) {
      await this.persistence.addConfigChange(sessionId, change);
    }

    // Emit receipt
    const receipt = this.receiptSystem.emit({
      session_id: sessionId,
      actor: 'rob',
      action_type: 'config.updated',
      outcome: 'success',
      evidence_refs: [],
      truth_state: 'Verified',
      metadata: change as unknown as Record<string, unknown>,
    });

    if (this.persistence) {
      await this.persistence.addReceipt(receipt);
    }
  }

  // ==========================================================================
  // PROGRESS & READINESS
  // ==========================================================================

  /**
   * Compute progress percentage (0-100)
   * Based on completed steps, NOT readiness
   */
  async computeProgress(sessionId: string): Promise<number> {
    const session = await this.getSession(sessionId);
    if (!session) return 0;

    const receipts = this.persistence
      ? await this.persistence.getReceipts(sessionId)
      : this.receiptSystem.getReceiptsForSession(sessionId);

    // Define required steps and their weights
    const steps = [
      { type: 'session.created', weight: 5 },
      { type: 'template.selected', weight: 10 },
      { type: 'app.named', weight: 10 },
      { type: 'features.selected', weight: 15 },
      { type: 'theme.configured', weight: 10 },
      { type: 'build.started', weight: 10 },
      { type: 'build.passed', weight: 20 },
      { type: 'deploy.requested', weight: 10 },
      { type: 'vercel.deploy_success', weight: 10 },
    ];

    let progress = 0;
    for (const step of steps) {
      const completed = receipts.some((r) => r.action_type === step.type);
      if (completed) {
        progress += step.weight;
      }
    }

    return Math.min(progress, 100);
  }

  /**
   * Compute readiness tier based on gate receipts
   */
  async computeReadiness(sessionId: string): Promise<ReadinessTier> {
    const receipts = this.persistence
      ? await this.persistence.getReceipts(sessionId)
      : this.receiptSystem.getReceiptsForSession(sessionId);

    const hasReceipt = (type: string) => receipts.some((r) => r.action_type === type);

    // Published: Deployment confirmed
    if (hasReceipt('vercel.deploy_success') && hasReceipt('healthcheck.ok')) {
      return 'published';
    }

    // Ready: Ready to deploy
    if (
      hasReceipt('deploy.intent_confirmed') &&
      hasReceipt('build.passed') &&
      hasReceipt('safety.passed')
    ) {
      return 'ready';
    }

    // Viable: Build works
    if (hasReceipt('build.passed') && hasReceipt('preview.rendered')) {
      return 'viable';
    }

    // Shaped: Features defined
    if (hasReceipt('features.selected') && hasReceipt('dependencies.resolved')) {
      return 'shaped';
    }

    // Draft: Just started
    return 'draft';
  }

  /**
   * Update progress and readiness for a session
   */
  async updateProgressAndReadiness(sessionId: string): Promise<void> {
    const progress = await this.computeProgress(sessionId);
    const readiness = await this.computeReadiness(sessionId);

    if (this.persistence) {
      await this.persistence.updateSession(sessionId, {
        progress_percent: progress,
        readiness_tier: readiness,
      });
    }
  }

  // ==========================================================================
  // UNDO SUPPORT
  // ==========================================================================

  /**
   * Push undo snapshot
   */
  async pushUndoSnapshot(sessionId: string, actionType: string, snapshot: Record<string, unknown>): Promise<void> {
    const undoSnapshot: UndoSnapshot = {
      action_type: actionType,
      snapshot,
    };

    if (this.persistence) {
      await this.persistence.pushUndoSnapshot(sessionId, undoSnapshot);
    }

    // Emit receipt
    const receipt = this.receiptSystem.emit({
      session_id: sessionId,
      actor: 'rob',
      action_type: 'undo.snapshot_saved',
      outcome: 'success',
      evidence_refs: [],
      truth_state: 'Verified',
      metadata: { action_type: actionType },
    });

    if (this.persistence) {
      await this.persistence.addReceipt(receipt);
    }
  }

  /**
   * Undo last action
   */
  async undoLast(sessionId: string): Promise<UndoSnapshot | null> {
    if (!this.persistence) {
      throw new Error('Persistence required for undo');
    }

    const snapshot = await this.persistence.popUndoSnapshot(sessionId);
    if (!snapshot) {
      return null;
    }

    // Restore snapshot to session
    await this.persistence.updateSession(sessionId, {
      app_config: snapshot.snapshot.app_config as Record<string, unknown>,
    });

    // Emit receipt
    const receipt = this.receiptSystem.emit({
      session_id: sessionId,
      actor: 'user',
      action_type: 'action.undone',
      outcome: 'success',
      evidence_refs: [],
      truth_state: 'Verified',
      metadata: { action_type: snapshot.action_type },
    });

    await this.persistence.addReceipt(receipt);

    return snapshot;
  }

  // ==========================================================================
  // TRUTHSERUM INTEGRATION
  // ==========================================================================

  /**
   * Validate session receipts with TruthSerum
   */
  async validateSession(sessionId: string) {
    const receipts = this.persistence
      ? await this.persistence.getReceipts(sessionId)
      : this.receiptSystem.getReceiptsForSession(sessionId);

    return this.truthSerum.validate(sessionId, receipts);
  }

  // ==========================================================================
  // INTELLIGENCE ENFORCEMENT (MECHANICAL LAW)
  // ==========================================================================

  /**
   * STEP 1: Decompose user prompt into intelligence receipts
   * 
   * This is the FIRST step when processing any build request.
   * Generates the required intelligence receipts that prove Rob is thinking.
   */
  async decomposeIdea(
    sessionId: string,
    messageId: string,
    userPrompt: string
  ): Promise<IntelligenceReceipt[]> {
    const result = await this.ideaDecomposer.decompose(sessionId, messageId, userPrompt);

    // Store receipts
    if (this.persistence) {
      for (const receipt of result.receipts) {
        await this.persistence.addReceipt(receipt as any);
      }
    }

    // Emit progress update
    const progressReceipt = this.receiptSystem.emit({
      session_id: sessionId,
      actor: 'rob',
      action_type: 'intelligence.generated',
      outcome: 'success',
      evidence_refs: result.receipts.map((r) => r.type),
      truth_state: 'Verified',
      metadata: {
        receiptsGenerated: result.receipts.length,
        domain: result.summary.domain,
        recommendedPath: result.summary.recommendedPath,
      },
    });

    if (this.persistence) {
      await this.persistence.addReceipt(progressReceipt);
    }

    return result.receipts;
  }

  /**
   * STEP 1.5: Generate living preview (optional standalone call)
   */
  async generatePreview(
    sessionId: string,
    messageId: string,
    intelligenceReceipts: IntelligenceReceipt[]
  ): Promise<PreviewResult> {
    return this.previewGenerator.generate(sessionId, messageId, intelligenceReceipts);
  }

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
  async processBuildRequest(
    sessionId: string,
    userPrompt: string,
    intelligenceReceipts: IntelligenceReceipt[]
  ): Promise<{ success: boolean; message: string; state: RobState; preview?: PreviewResult }> {
    // GUARD: Enforce intelligence requirements
    const result = await IntelligenceGuard.guard(
      {
        sessionId,
        operation: 'processBuildRequest',
        receipts: intelligenceReceipts,
      },
      async () => {
        // Intelligence requirements met - proceed with build
        return this.executeBuild(sessionId, userPrompt, intelligenceReceipts);
      }
    );

    if (!result.allowed) {
      // BLOCKED: Intelligence requirements not met
      await this.transitionState(
        sessionId,
        'BLOCKED',
        `Intelligence violation: ${result.error?.message}`
      );

      // Emit violation receipt
      if (result.violationReceipt && this.persistence) {
        await this.persistence.addReceipt(result.violationReceipt);
      }

      return {
        success: false,
        message: result.error?.message || 'Intelligence requirements not met',
        state: 'BLOCKED',
      };
    }

    return {
      success: true,
      message: 'Build request processed with verified intelligence',
      state: result.data?.state || 'BUILDING',
      preview: result.data?.preview,
    };
  }

  /**
   * Execute build (internal - only called after intelligence guard passes)
   */
  private async executeBuild(
    sessionId: string,
    userPrompt: string,
    intelligenceReceipts: IntelligenceReceipt[]
  ): Promise<{ state: RobState; preview?: PreviewResult }> {
    // Transition to BUILDING
    await this.transitionState(sessionId, 'BUILDING', 'Intelligence verified, building...');

    // Store intelligence receipts
    if (this.persistence) {
      for (const receipt of intelligenceReceipts) {
        await this.persistence.addReceipt(receipt as any);
      }
    }

    // Generate living preview (Phase 3)
    let previewResult: PreviewResult | undefined;
    try {
      const messageId = `msg_${Date.now()}`;
      previewResult = await this.previewGenerator.generate(
        sessionId,
        messageId,
        intelligenceReceipts
      );

      // Store preview receipt
      if (this.persistence && previewResult.receipt) {
        await this.persistence.addReceipt(previewResult.receipt as any);
      }

      // Emit preview success
      this.receiptSystem.emit({
        session_id: sessionId,
        actor: 'rob',
        action_type: 'preview.ready',
        outcome: 'success',
        evidence_refs: [],
        truth_state: 'Verified',
        metadata: {
          componentName: previewResult.componentName,
          linesOfCode: previewResult.linesOfCode,
          interactivityLevel: previewResult.interactivityLevel,
        },
      });
    } catch (error) {
      // Preview generation failed - emit failure receipt but continue
      this.receiptSystem.emit({
        session_id: sessionId,
        actor: 'rob',
        action_type: 'preview.failed',
        outcome: 'error',
        evidence_refs: [],
        truth_state: 'Unknown',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    // Transition to VERIFYING
    await this.transitionState(sessionId, 'VERIFYING', 'Build complete, verifying...');

    return { state: 'VERIFYING', preview: previewResult };
  }

  /**
   * FORBIDDEN: Update session without intelligence
   * 
   * Title-only updates are BLOCKED by mechanical law
   */
  async updateSessionMetadata(
    sessionId: string,
    updates: Partial<Pick<RobSession, 'app_name' | 'template_id'>>,
    intelligenceReceipts: IntelligenceReceipt[]
  ): Promise<void> {
    // Check if this is a title-only update (FORBIDDEN)
    if (updates.app_name && !updates.template_id && intelligenceReceipts.length === 0) {
      IntelligenceGuard.blockTitleOnlyUpdate(sessionId, 'updateSessionMetadata');
    }

    // GUARD: Require intelligence if making structural changes
    const requiresIntelligence = Object.keys(updates).length > 0;

    if (requiresIntelligence) {
      await IntelligenceGuard.guard(
        {
          sessionId,
          operation: 'updateSessionMetadata',
          receipts: intelligenceReceipts,
        },
        async () => {
          // Update allowed
          if (this.persistence) {
            await this.persistence.updateSession(sessionId, updates as any);
          }
        }
      );
    } else {
      // No-op update
      if (this.persistence) {
        await this.persistence.updateSession(sessionId, updates as any);
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private generateId(): string {
    return `rob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get receipt system (for external access)
   */
  getReceiptSystem(): ReceiptSystem {
    return this.receiptSystem;
  }
}
