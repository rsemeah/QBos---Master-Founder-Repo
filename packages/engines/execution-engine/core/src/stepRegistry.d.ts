/**
 * Step Registry - Stable step definitions
 */
import type { StepDefinition } from './types';
export declare class StepRegistry {
    private steps;
    constructor();
    registerStep(step: StepDefinition): void;
    getStep(stepId: string): StepDefinition | null;
    getStepsForGoals(goals: string[]): StepDefinition[];
    private registerDefaultSteps;
    private checkEnvironment;
    private checkDatabase;
    private setupIdentity;
    private setupCharter;
    private setupConfig;
    private confirmCompletion;
    private freezeArchitecture;
    private writeLocalReceipt;
}
//# sourceMappingURL=stepRegistry.d.ts.map