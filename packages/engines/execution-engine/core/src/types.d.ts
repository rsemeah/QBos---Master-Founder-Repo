/**
 * ExecutionEngine™ Types - Production Grade
 */
export type BuildSessionStatus = 'active' | 'completed' | 'failed';
export type StepStatus = 'pending' | 'success' | 'error';
export type StepActionType = 'check' | 'generate' | 'confirm';
export interface BuildSession {
    id: string;
    appName: string;
    goals: string[];
    status: BuildSessionStatus;
    currentStepIndex: number;
    steps: BuildStep[];
    createdAt: string;
    updatedAt: string;
    enginesTouched: string[];
}
export interface BuildStep {
    id: string;
    title: string;
    explanation: string;
    actionType: StepActionType;
    status: StepStatus;
    result?: StepResult;
}
export interface StepResult {
    ok: boolean;
    summary: string;
    evidence?: Evidence[];
    artifacts?: Artifact[];
    warnings?: string[];
}
export interface Evidence {
    type: 'file' | 'env' | 'runtime';
    description: string;
    reference: string;
    hash?: string;
}
export interface Artifact {
    type: 'file_patch' | 'file_create' | 'command' | 'env_var' | 'sql';
    target: string;
    payload: string;
    applyMode: 'manual_only';
}
export interface ReceiptsBundle {
    appName: string;
    sessionId: string;
    goals: string[];
    enginesTouched: string[];
    stepsRun: Array<{
        id: string;
        status: StepStatus;
        summary: string;
    }>;
    checksPassed: string[];
    checksFailed: string[];
    createdAt: string;
    qbOSVersion: string;
}
export interface StepDefinition {
    id: string;
    version: string;
    goalTags: string[];
    title: string;
    explanation: string;
    actionType: StepActionType;
    execute: (session: BuildSession) => Promise<StepResult>;
}
export interface ExecutionEngineResult<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map