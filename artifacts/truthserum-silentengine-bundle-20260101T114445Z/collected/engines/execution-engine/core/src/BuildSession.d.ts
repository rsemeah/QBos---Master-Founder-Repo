/**
 * BuildSession - Session state management
 */
import type { BuildSession, BuildStep } from './types';
export declare function createNewSession(id: string, appName: string, goals: string[]): BuildSession;
export declare function addStepToSession(session: BuildSession, step: BuildStep): BuildSession;
export declare function updateStepResult(session: BuildSession, stepId: string, result: BuildStep['result']): BuildSession;
export declare function markSessionComplete(session: BuildSession): BuildSession;
//# sourceMappingURL=BuildSession.d.ts.map