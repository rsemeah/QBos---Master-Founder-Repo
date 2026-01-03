"use strict";
/**
 * BuildSession - Session state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewSession = createNewSession;
exports.addStepToSession = addStepToSession;
exports.updateStepResult = updateStepResult;
exports.markSessionComplete = markSessionComplete;
function createNewSession(id, appName, goals) {
    return {
        id,
        appName,
        goals,
        status: 'active',
        currentStepIndex: 0,
        steps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enginesTouched: [],
    };
}
function addStepToSession(session, step) {
    return {
        ...session,
        steps: [...session.steps, step],
        updatedAt: new Date().toISOString(),
    };
}
function updateStepResult(session, stepId, result) {
    const stepIndex = session.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) {
        return session;
    }
    const status = result?.ok ? 'success' : 'error';
    const updatedSteps = [...session.steps];
    updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        status,
        result,
    };
    // Track engine touched
    const engineName = stepId.split('.')[0];
    const enginesTouched = session.enginesTouched.includes(engineName)
        ? session.enginesTouched
        : [...session.enginesTouched, engineName];
    return {
        ...session,
        steps: updatedSteps,
        currentStepIndex: status === 'success' ? session.currentStepIndex + 1 : session.currentStepIndex,
        enginesTouched,
        updatedAt: new Date().toISOString(),
    };
}
function markSessionComplete(session) {
    const hasErrors = session.steps.some((s) => s.status === 'error');
    return {
        ...session,
        status: hasErrors ? 'failed' : 'completed',
        updatedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=BuildSession.js.map