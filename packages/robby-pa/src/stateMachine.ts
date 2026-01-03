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
  PIVOTING = 'pivoting',
  COMPLETED = 'completed'
}

export enum VerdictState {
  ANALYZING = 'analyzing',
  READY = 'ready',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum UXState {
  SHAPING = 'shaping',
  BUILDING = 'building',
  READY = 'ready'
}

export type PhaseStateKey = string; // e.g. 'INTENT.collecting'

export const VALID_TRANSITIONS: Record<string, string[]> = {
  'INTENT.collecting': ['INTENT.refining'],
  'INTENT.refining': ['INTENT.confirming'],
  'INTENT.confirming': ['INTENT.locked', 'INTENT.refining'],
  'INTENT.locked': ['EXECUTION.queued'],

  'EXECUTION.queued': ['EXECUTION.running'],
  'EXECUTION.running': ['EXECUTION.blocked', 'EXECUTION.completed'],
  'EXECUTION.blocked': ['INTENT.refining', 'VERDICT.ready'],
  'EXECUTION.pivoting': ['EXECUTION.running', 'EXECUTION.blocked'],
  'EXECUTION.completed': ['VERDICT.analyzing'],

  'VERDICT.analyzing': ['VERDICT.ready'],
  'VERDICT.ready': ['VERDICT.accepted', 'VERDICT.rejected'],
  'VERDICT.rejected': ['INTENT.collecting'],
  'VERDICT.accepted': []
};

export function isValidTransition(fromPhase: RobbyPhase | string, fromState: string, toPhase: RobbyPhase | string, toState: string): boolean {
  const fromKey = `${fromPhase}.${fromState}`;
  const toKey = `${toPhase}.${toState}`;
  const allowed = VALID_TRANSITIONS[fromKey] || [];
  return allowed.includes(toKey);
}

export function mapToUXState(phase: RobbyPhase | string): UXState {
  if (phase === RobbyPhase.INTENT) return UXState.SHAPING;
  if (phase === RobbyPhase.EXECUTION) return UXState.BUILDING;
  if (phase === RobbyPhase.VERDICT) return UXState.READY;
  throw new Error('Invalid phase');
}

export async function transitionPhase(current: { phase: string; sub_state: string }, targetPhase: RobbyPhase | string, targetState: string): Promise<{ phase: string; sub_state: string; ux_state: UXState }> {
  const currentKey = `${current.phase}.${current.sub_state}`;
  const targetKey = `${targetPhase}.${targetState}`;
  const allowed = VALID_TRANSITIONS[currentKey] || [];
  if (!allowed.includes(targetKey)) {
    throw new Error(`Invalid transition: ${currentKey} -> ${targetKey}`);
  }

  return {
    phase: String(targetPhase),
    sub_state: targetState,
    ux_state: mapToUXState(targetPhase)
  };
}

export default {};
