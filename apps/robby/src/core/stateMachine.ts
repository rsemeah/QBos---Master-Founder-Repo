export enum RobbyPhase {
  INTENT = 'INTENT',
  EXECUTION = 'EXECUTION',
  VERDICT = 'VERDICT'
}

export enum IntentState {
  COLLECTING = 'collecting',
  REFINING = 'refining',
  CONFIRMING = 'confirming',
  LOCKED = 'locked'
}

export enum ExecutionState {
  QUEUED = 'queued',
  RUNNING = 'running',
  BLOCKED = 'blocked',
  COMPLETED = 'completed'
}

export enum VerdictState {
  ANALYZING = 'analyzing',
  READY = 'ready',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export const VALID_TRANSITIONS: Record<string, boolean> = {
  'INTENT.collecting → INTENT.refining': true,
  'INTENT.refining → INTENT.confirming': true,
  'INTENT.confirming → INTENT.locked': true,
  'INTENT.locked → EXECUTION.queued': true,
  'EXECUTION.queued → EXECUTION.running': true,
  'EXECUTION.running → EXECUTION.blocked': true,
  'EXECUTION.running → EXECUTION.completed': true,
  'EXECUTION.blocked → VERDICT.analyzing': true,
  'EXECUTION.completed → VERDICT.analyzing': true,
  'VERDICT.analyzing → VERDICT.ready': true,
  'VERDICT.ready → VERDICT.accepted': true,
  'VERDICT.ready → VERDICT.rejected': true,
  'VERDICT.rejected → INTENT.collecting': true,
  'EXECUTION.blocked → INTENT.collecting': true
};

export function isValidTransition(fromPhase: string, fromState: string, toPhase: string, toState: string): boolean {
  const key = `${fromPhase}.${fromState} → ${toPhase}.${toState}`;
  return !!VALID_TRANSITIONS[key];
}
