/**
 * BuildSession - Session state management
 */

import type { BuildSession, BuildStep } from './types';

export function createNewSession(id: string, appName: string, goals: string[]): BuildSession {
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

export function addStepToSession(session: BuildSession, step: BuildStep): BuildSession {
  return {
    ...session,
    steps: [...session.steps, step],
    updatedAt: new Date().toISOString(),
  };
}

export function updateStepResult(
  session: BuildSession,
  stepId: string,
  result: BuildStep['result']
): BuildSession {
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

export function markSessionComplete(session: BuildSession): BuildSession {
  const hasErrors = session.steps.some((s) => s.status === 'error');
  return {
    ...session,
    status: hasErrors ? 'failed' : 'completed',
    updatedAt: new Date().toISOString(),
  };
}
