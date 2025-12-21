/**
 * Generate receipts for a completed build session
 */

import type { BuildSession, ReceiptsBundle } from '../types';

export function generateReceipts(session: BuildSession): ReceiptsBundle {
  const stepsRun = session.steps.map((step) => ({
    id: step.id,
    status: step.status,
    summary: step.result?.summary || step.explanation,
  }));

  const checksPassed = session.steps
    .filter((s) => s.actionType === 'check' && s.status === 'success')
    .map((s) => s.title);

  const checksFailed = session.steps
    .filter((s) => s.actionType === 'check' && s.status === 'error')
    .map((s) => s.title);

  return {
    appName: session.appName,
    sessionId: session.id,
    goals: session.goals,
    enginesTouched: session.enginesTouched,
    stepsRun,
    checksPassed,
    checksFailed,
    createdAt: session.createdAt,
    qbOSVersion: '3.0.0',
  };
}
