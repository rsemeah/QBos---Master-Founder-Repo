import { EventEmitter } from 'events';
import { ExecutionEngine } from './ExecutionEngine';
import { RobEngine, type RobEnginePersistence } from './RobEngine';

export interface EngineOrchestratorConfig {
  persistence?: RobEnginePersistence;
}

/**
 * EngineOrchestrator coordinates core engines and lifecycle hooks.
 *
 * This lightweight orchestrator avoids hard dependencies on optional infra
 * while still providing a single entrypoint for initialization and shutdown.
 */
export class EngineOrchestrator extends EventEmitter {
  readonly executionEngine: ExecutionEngine;
  readonly robEngine: RobEngine;

  private isInitialized = false;

  constructor(config: EngineOrchestratorConfig = {}) {
    super();
    this.executionEngine = new ExecutionEngine();
    this.robEngine = new RobEngine(config.persistence);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.emit('initialized');
  }

  async init(): Promise<void> {
    await this.initialize();
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.isInitialized = false;
    this.emit('shutdown');
  }

  getReceiptSystem() {
    return this.robEngine.getReceiptSystem();
  }

  async invokeAI(
    context: { sessionId: string; userId: string },
    messages: Array<{ role: string; content: string }>,
    options?: { maxCost?: number; preferredCapabilities?: string[] }
  ): Promise<{ ok: boolean; data: { message: string; response: string }; receipts: any[]; error?: string }> {
    const latest = messages[messages.length - 1]?.content ?? '';
    const receiptSystem = this.robEngine.getReceiptSystem();
    receiptSystem.emit({
      session_id: context.sessionId,
      actor: 'rob',
      action_type: 'silent.generated',
      outcome: 'success',
      evidence_refs: [],
      truth_state: 'Verified',
      metadata: {
        userId: context.userId,
        maxCost: options?.maxCost,
        preferredCapabilities: options?.preferredCapabilities,
      },
    });

    return {
      ok: true,
      data: {
        message: `Status unknown - AI response placeholder: ${latest}`,
        response: `Status unknown - AI response placeholder: ${latest}`,
      },
      receipts: receiptSystem.getReceiptsForSession(context.sessionId),
    };
  }

  async createSession(userEmail: string): Promise<{ ok: boolean; data: { sessionId: string; userId: string } }> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userId = `user_${Math.random().toString(36).slice(2, 7)}`;
    const receiptSystem = this.robEngine.getReceiptSystem();
    receiptSystem.emit({
      session_id: sessionId,
      actor: 'user',
      action_type: 'session.created',
      outcome: 'success',
      evidence_refs: [],
      truth_state: 'Verified',
      metadata: { userEmail },
    });

    return {
      ok: true,
      data: { sessionId, userId },
    };
  }
}
