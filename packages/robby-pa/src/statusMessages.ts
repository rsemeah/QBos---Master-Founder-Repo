export const STATUS_MESSAGES: Record<string, string> = {
  'INTENT.collecting': "Let's plan the build",
  'INTENT.refining': 'Getting clear on what you need',
  'INTENT.confirming': "Confirming what we're building",
  'INTENT.locked': 'Build plan locked',

  'EXECUTION.queued': 'Preparing to build',
  'EXECUTION.running': 'Working quietly in the background',
  'EXECUTION.blocked': 'Getting clear on one detail',
  'EXECUTION.completed': 'Build complete',

  'VERDICT.analyzing': 'Reviewing the build',
  'VERDICT.ready': 'Build review ready',
  'VERDICT.accepted': 'Build ready',
  'VERDICT.rejected': "Let's refine this together"
};

export function getUserMessage(phase: string, subState: string): string {
  const key = `${phase}.${subState}`;
  return STATUS_MESSAGES[key] || 'Working on it';
}

export default {};
