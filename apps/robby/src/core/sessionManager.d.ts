import { ExecutionState, IntentState, RobbyPhase, VerdictState } from './stateMachine.ts';
export type IntentPayload = {
    goal: string;
    successCriteria: string[];
    scope: {
        in: string[];
        out: string[];
    };
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
export declare class SessionManager {
    private sessions;
    createSession(initialGoal?: string): Session;
    getSession(sessionId: string): Session | null;
    submitIntent(sessionId: string, intent: IntentPayload): Session;
    approveIntent(sessionId: string, approved: boolean): Promise<Session>;
    execute(sessionId: string): Promise<{
        status: string;
        blockers: string[];
    } | {
        status: string;
        blockers?: undefined;
    }>;
    getStatus(sessionId: string): {
        error: string;
        sessionId?: undefined;
        phase?: undefined;
        state?: undefined;
        progress?: undefined;
        blockers?: undefined;
        nextAction?: undefined;
    } | {
        sessionId: string;
        phase: RobbyPhase;
        state: string;
        progress: {
            tasksTotal: number;
            tasksCompleted: number;
        };
        blockers: string[];
        nextAction: string | null;
        error?: undefined;
    };
    private deriveNextAction;
    private checkReceiptExists;
}
//# sourceMappingURL=sessionManager.d.ts.map