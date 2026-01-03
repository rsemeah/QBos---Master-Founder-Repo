/**
 * StateStore - Session persistence abstraction
 */
import type { BuildSession } from './types';
export declare class StateStore {
    private sessions;
    saveSession(session: BuildSession): void;
    getSession(sessionId: string): BuildSession | null;
    hasSession(sessionId: string): boolean;
    deleteSession(sessionId: string): boolean;
    getAllSessions(): BuildSession[];
}
//# sourceMappingURL=stateStore.d.ts.map