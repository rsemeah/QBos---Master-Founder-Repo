import * as fs from 'node:fs';
import * as path from 'node:path';
import { robbyReceipt } from '../util/robby-receipt';
import { ExecutionState, IntentState, RobbyPhase, VerdictState, isValidTransition } from './stateMachine';

const RECEIPTS_PATH = path.resolve('receipts/robby/robby.receipts.jsonl');

export type IntentPayload = {
  goal: string;
  successCriteria: string[];
  scope: { in: string[]; out: string[] };
  constraints?: string[];
  unknowns?: string[];
  engines?: string[];
  humanApproved?: boolean;
};

export type Session = {
  id: string;
  phase: RobbyPhase;
  state: IntentState | ExecutionState | VerdictState | string;
  intent?: IntentPayload | null;
  blockers: string[];
};

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(initialGoal?: string) {
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const session: Session = {
      id,
      phase: RobbyPhase.INTENT,
      state: IntentState.COLLECTING,
      intent: initialGoal
        ? { goal: initialGoal, successCriteria: [], scope: { in: [], out: [] }, engines: [], unknowns: [], humanApproved: false }
        : null,
      blockers: []
    };
    this.sessions.set(id, session);
    robbyReceipt('session.created', { sessionId: id, initialGoal });
    return session;
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId) || null;
  }

  submitIntent(sessionId: string, intent: IntentPayload) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error('session_not_found');

    if (!isValidTransition('INTENT', s.state as string, 'INTENT', IntentState.CONFIRMING)) {
      throw new Error('INVALID_TRANSITION');
    }

    s.intent = { ...intent, humanApproved: false };
    s.state = IntentState.CONFIRMING;
    robbyReceipt('intent.submitted', { sessionId, intent: s.intent });
    return s;
  }

  async approveIntent(sessionId: string, approved: boolean) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error('session_not_found');
    if (s.state !== IntentState.CONFIRMING) throw new Error('INVALID_INTENT_STATE');

    if (!approved) {
      s.state = IntentState.COLLECTING;
      s.intent = null;
      robbyReceipt('intent.approval.denied', { sessionId });
      return s;
    }

    // Write an intent.locked receipt (this is required for execution gate)
    const receipt = await robbyReceipt('intent.locked', { sessionId, approvedBy: 'human' });
    s.intent = { ...(s.intent || {}), humanApproved: true } as IntentPayload;
    s.state = IntentState.LOCKED;
    robbyReceipt('intent.locked.ack', { sessionId, receiptId: receipt.id });
    return s;
  }

  async execute(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error('session_not_found');

    // Execution gate: check for intent.locked receipt
    const lockedExists = this.checkReceiptExists(sessionId, 'intent.locked');
    if (!lockedExists) {
      s.phase = RobbyPhase.EXECUTION;
      s.state = ExecutionState.BLOCKED;
      s.blockers = ['intent.locked missing'];
      robbyReceipt('execution.blocked', { sessionId, reason: 'intent_not_locked' });
      return { status: 'blocked', blockers: s.blockers };
    }

    // Otherwise queue tasks
    s.phase = RobbyPhase.EXECUTION;
    s.state = ExecutionState.RUNNING;
    s.blockers = [];
    const started = robbyReceipt('execution.started', { sessionId });
    // For iteration 1 we don't actually run engines; simulate completion
    robbyReceipt('execution.completed', { sessionId, startedId: (started as any).id });
    s.state = ExecutionState.COMPLETED;
    return { status: 'running' };
  }

  getStatus(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) return { error: 'session_not_found' };
    return {
      sessionId: s.id,
      phase: s.phase,
      state: s.state,
      progress: { tasksTotal: 0, tasksCompleted: 0 },
      blockers: s.blockers,
      nextAction: this.deriveNextAction(s)
    };
  }

  private deriveNextAction(s: Session) {
    if (s.phase === RobbyPhase.INTENT && s.state === IntentState.COLLECTING) return 'POST /api/v1/sessions/{id}/intent';
    if (s.phase === RobbyPhase.INTENT && s.state === IntentState.CONFIRMING) return 'POST /api/v1/sessions/{id}/intent/approve';
    if (s.phase === RobbyPhase.INTENT && s.state === IntentState.LOCKED) return 'POST /api/v1/sessions/{id}/execute';
    if (s.phase === RobbyPhase.EXECUTION && s.state === ExecutionState.BLOCKED) return null;
    return null;
  }

  private checkReceiptExists(sessionId: string, type: string) {
    try {
      if (!fs.existsSync(RECEIPTS_PATH)) return false;
      const lines = fs.readFileSync(RECEIPTS_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
      return lines.map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean).some((r: any) => r.type === type && r.payload && (r.payload.sessionId === sessionId || r.payload.sessionId === undefined));
    } catch (e) {
      return false;
    }
  }
}
