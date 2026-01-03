"use strict";
/**
 * ExecutionEngine™ - Interactive Build Command Center
 *
 * PRODUCT TRUTH:
 * This engine allows non-technical founders to build serious apps step-by-step.
 * Every action is explained. State is never lost. Nothing is hidden.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionEngine = void 0;
const stateStore_1 = require("./stateStore");
const stepRegistry_1 = require("./stepRegistry");
const BuildSession_1 = require("./BuildSession");
const generateReceipts_1 = require("./receipts/generateReceipts");
const appSpec_1 = require("./appSpec");
class ExecutionEngine {
    stateStore;
    stepRegistry;
    executingSteps = new Set(); // Prevent concurrent execution
    constructor() {
        this.stateStore = new stateStore_1.StateStore();
        this.stepRegistry = new stepRegistry_1.StepRegistry();
    }
    /**
     * Creates a new build session
     * @returns sessionId
     */
    async createBuildSession(appName, goals, appSpec) {
        if (appSpec) {
            const validation = (0, appSpec_1.validateAppSpec)(appSpec);
            if (!validation.ok) {
                throw new Error(`AppSpec validation failed: ${validation.errors.join(' ')}`);
            }
            if (appSpec.appName !== appName) {
                throw new Error('AppSpec appName must match createBuildSession appName.');
            }
            if (appSpec.goals.join('|') !== goals.join('|')) {
                throw new Error('AppSpec goals must match createBuildSession goals.');
            }
        }
        const sessionId = `build_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        let session = (0, BuildSession_1.createNewSession)(sessionId, appName, goals);
        // Get steps for goals
        const stepDefinitions = this.stepRegistry.getStepsForGoals(goals);
        // Add universal steps (environment check, etc.)
        const universalStep = this.stepRegistry.getStep('env.check.node');
        if (universalStep) {
            session = (0, BuildSession_1.addStepToSession)(session, {
                id: universalStep.id,
                title: universalStep.title,
                explanation: universalStep.explanation,
                actionType: universalStep.actionType,
                status: 'pending',
            });
        }
        const architectureFreezeStep = this.stepRegistry.getStep('architecture.freeze');
        if (architectureFreezeStep) {
            session = (0, BuildSession_1.addStepToSession)(session, {
                id: architectureFreezeStep.id,
                title: architectureFreezeStep.title,
                explanation: architectureFreezeStep.explanation,
                actionType: architectureFreezeStep.actionType,
                status: 'pending',
            });
        }
        // Add goal-specific steps
        for (const def of stepDefinitions) {
            if (def.goalTags.includes('*'))
                continue; // Already added universal
            session = (0, BuildSession_1.addStepToSession)(session, {
                id: def.id,
                title: def.title,
                explanation: def.explanation,
                actionType: def.actionType,
                status: 'pending',
            });
        }
        // Add final confirmation
        const finalStep = this.stepRegistry.getStep('session.confirm.complete');
        if (finalStep) {
            session = (0, BuildSession_1.addStepToSession)(session, {
                id: finalStep.id,
                title: finalStep.title,
                explanation: finalStep.explanation,
                actionType: finalStep.actionType,
                status: 'pending',
            });
        }
        this.stateStore.saveSession(session);
        return sessionId;
    }
    /**
     * Gets the next pending step
     * @returns EXACTLY ONE step or null if done
     */
    async getNextStep(sessionId) {
        const session = this.stateStore.getSession(sessionId);
        if (!session) {
            return {
                ok: false,
                error: `We couldn't find session "${sessionId}". It may have been deleted or never existed. Please create a new build session to start fresh.`,
            };
        }
        if (session.status === 'completed') {
            return {
                ok: false,
                error: `This build is already finished! You can get your receipts to see everything we built together.`,
            };
        }
        // Get step at current index
        const nextStep = session.steps[session.currentStepIndex];
        if (!nextStep) {
            return {
                ok: false,
                error: `All steps are complete. Please call getReceipts() to see what we built.`,
            };
        }
        return {
            ok: true,
            data: nextStep,
        };
    }
    /**
     * Executes a specific step (idempotent)
     */
    async executeStep(sessionId, stepId) {
        const session = this.stateStore.getSession(sessionId);
        if (!session) {
            return {
                ok: false,
                error: `Session "${sessionId}" not found. Sessions cannot disappear - this is a bug. Please report it.`,
            };
        }
        const step = session.steps.find((s) => s.id === stepId);
        if (!step) {
            return {
                ok: false,
                error: `Step "${stepId}" doesn't exist in this build. Available steps: ${session.steps.map((s) => s.id).join(', ')}`,
            };
        }
        // Idempotency: return existing result if already executed
        if (step.status === 'success' && step.result) {
            return {
                ok: true,
                data: step,
            };
        }
        if (step.status === 'error' && step.result) {
            return {
                ok: false,
                error: `This step already failed with: ${step.result.summary}`,
                data: step,
            };
        }
        // Concurrent execution prevention
        const execKey = `${sessionId}:${stepId}`;
        if (this.executingSteps.has(execKey)) {
            return {
                ok: false,
                error: `This step is already running. Please wait for it to finish before trying again.`,
            };
        }
        this.executingSteps.add(execKey);
        try {
            // Get step definition and execute
            const stepDef = this.stepRegistry.getStep(stepId);
            if (!stepDef) {
                return {
                    ok: false,
                    error: `We don't know how to execute "${stepId}". This step isn't registered yet.`,
                };
            }
            const result = await stepDef.execute(session);
            // Update session with result
            const updatedSession = (0, BuildSession_1.updateStepResult)(session, stepId, result);
            this.stateStore.saveSession(updatedSession);
            // Check if all steps done
            if (updatedSession.currentStepIndex >= updatedSession.steps.length) {
                const completedSession = (0, BuildSession_1.markSessionComplete)(updatedSession);
                this.stateStore.saveSession(completedSession);
            }
            const updatedStep = updatedSession.steps.find((s) => s.id === stepId);
            return {
                ok: result.ok,
                data: updatedStep,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error
                ? error.message
                : 'Something unexpected happened. Please try again or ask for help.';
            const failedResult = {
                ok: false,
                summary: `Step failed: ${errorMsg}`,
            };
            const updatedSession = (0, BuildSession_1.updateStepResult)(session, stepId, failedResult);
            this.stateStore.saveSession(updatedSession);
            return {
                ok: false,
                error: errorMsg,
            };
        }
        finally {
            this.executingSteps.delete(execKey);
        }
    }
    /**
     * Gets receipts for completed session
     * Only allowed when session is completed
     */
    async getReceipts(sessionId) {
        const session = this.stateStore.getSession(sessionId);
        if (!session) {
            return {
                ok: false,
                error: `Session "${sessionId}" not found.`,
            };
        }
        if (session.status !== 'completed') {
            return {
                ok: false,
                error: `This build isn't finished yet. Complete all steps first, then you can get your receipts.`,
            };
        }
        const receipts = (0, generateReceipts_1.generateReceipts)(session);
        return {
            ok: true,
            data: receipts,
        };
    }
}
exports.ExecutionEngine = ExecutionEngine;
//# sourceMappingURL=ExecutionEngine.js.map