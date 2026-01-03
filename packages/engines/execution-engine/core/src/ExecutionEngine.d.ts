/**
 * ExecutionEngine™ - Interactive Build Command Center
 *
 * PRODUCT TRUTH:
 * This engine allows non-technical founders to build serious apps step-by-step.
 * Every action is explained. State is never lost. Nothing is hidden.
 */
import type { BuildStep, ExecutionEngineResult, ReceiptsBundle } from './types';
import { AppSpec } from './appSpec';
export declare class ExecutionEngine {
    private stateStore;
    private stepRegistry;
    private executingSteps;
    constructor();
    /**
     * Creates a new build session
     * @returns sessionId
     */
    createBuildSession(appName: string, goals: string[], appSpec?: AppSpec): Promise<string>;
    /**
     * Gets the next pending step
     * @returns EXACTLY ONE step or null if done
     */
    getNextStep(sessionId: string): Promise<ExecutionEngineResult<BuildStep>>;
    /**
     * Executes a specific step (idempotent)
     */
    executeStep(sessionId: string, stepId: string): Promise<ExecutionEngineResult<BuildStep>>;
    /**
     * Gets receipts for completed session
     * Only allowed when session is completed
     */
    getReceipts(sessionId: string): Promise<ExecutionEngineResult<ReceiptsBundle>>;
}
//# sourceMappingURL=ExecutionEngine.d.ts.map