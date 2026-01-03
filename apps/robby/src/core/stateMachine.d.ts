export declare enum RobbyPhase {
    INTENT = "INTENT",
    EXECUTION = "EXECUTION",
    VERDICT = "VERDICT"
}
export declare enum IntentState {
    COLLECTING = "collecting",
    REFINING = "refining",
    CONFIRMING = "confirming",
    LOCKED = "locked"
}
export declare enum ExecutionState {
    QUEUED = "queued",
    RUNNING = "running",
    BLOCKED = "blocked",
    COMPLETED = "completed"
}
export declare enum VerdictState {
    ANALYZING = "analyzing",
    READY = "ready",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}
export declare const VALID_TRANSITIONS: Record<string, boolean>;
export declare function isValidTransition(fromPhase: string, fromState: string, toPhase: string, toState: string): boolean;
//# sourceMappingURL=stateMachine.d.ts.map