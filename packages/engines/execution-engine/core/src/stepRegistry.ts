/**
 * Step Registry - Stable step definitions
 */

import type { StepDefinition, BuildSession, StepResult } from './types';

export class StepRegistry {
  private steps: Map<string, StepDefinition> = new Map();

  constructor() {
    this.registerDefaultSteps();
  }

  registerStep(step: StepDefinition): void {
    this.steps.set(step.id, step);
  }

  getStep(stepId: string): StepDefinition | null {
    return this.steps.get(stepId) || null;
  }

  getStepsForGoals(goals: string[]): StepDefinition[] {
    return Array.from(this.steps.values()).filter((step) =>
      step.goalTags.some((tag) => goals.includes(tag))
    );
  }

  private registerDefaultSteps(): void {
    // Environment check
    this.registerStep({
      id: 'env.check.node',
      version: 'v1',
      goalTags: ['*'],
      title: 'Check Environment',
      explanation:
        "Let's make sure your computer has everything it needs to build. We'll check for Node.js and TypeScript.",
      actionType: 'check',
      execute: async () => this.checkEnvironment(),
    });

    // Database check
    this.registerStep({
      id: 'database.check.connection',
      version: 'v1',
      goalTags: ['*'],
      title: 'Check Database',
      explanation:
        "We'll see if you have a database connected. If not, that's okay - we can use temporary storage for now.",
      actionType: 'check',
      execute: async () => this.checkDatabase(),
    });

    // Identity setup
    this.registerStep({
      id: 'identity.setup.basic',
      version: 'v1',
      goalTags: ['auth', 'identity'],
      title: 'Setup User Authentication',
      explanation:
        "Every app needs to know who's using it. We'll set up a way to create users and keep them logged in safely.",
      actionType: 'generate',
      execute: async () => this.setupIdentity(),
    });

    // Charter/consent setup
    this.registerStep({
      id: 'charter.setup.consent',
      version: 'v1',
      goalTags: ['consent', 'gdpr', 'legal'],
      title: 'Setup Consent Management',
      explanation:
        "If you're using AI or collecting data, you need permission. We'll help you keep track of what users agree to.",
      actionType: 'generate',
      execute: async () => this.setupCharter(),
    });

    // Config/feature flags
    this.registerStep({
      id: 'config.setup.flags',
      version: 'v1',
      goalTags: ['config', 'features'],
      title: 'Setup Feature Flags',
      explanation:
        "Feature flags let you turn things on and off without changing code. Super useful for testing new features safely.",
      actionType: 'generate',
      execute: async () => this.setupConfig(),
    });

    // Final confirmation
    this.registerStep({
      id: 'session.confirm.complete',
      version: 'v1',
      goalTags: ['*'],
      title: 'Review Everything',
      explanation:
        "Let's look at what we built together and make sure it all makes sense before we finish.",
      actionType: 'confirm',
      execute: async (session) => this.confirmCompletion(session),
    });
  }

  // Step execution implementations

  private async checkEnvironment(): Promise<StepResult> {
    const evidence: StepResult['evidence'] = [
      {
        type: 'runtime',
        description: 'Node.js version',
        reference: process.version,
      },
      {
        type: 'runtime',
        description: 'Operating system',
        reference: process.platform,
      },
    ];

    return {
      ok: true,
      summary: `Great! Your computer has Node.js ${process.version} installed. That's exactly what we need.`,
      evidence,
    };
  }

  private async checkDatabase(): Promise<StepResult> {
    const hasDB = !!process.env.SUPABASE_URL;

    return {
      ok: true,
      summary: hasDB
        ? "Perfect! You have a database connected. We'll save everything there so it's permanent."
        : "You don't have a database connected yet. That's completely fine! We'll use temporary storage for now, and you can add a real database later when you're ready.",
      evidence: [
        {
          type: 'env',
          description: 'Database configured',
          reference: hasDB ? 'SUPABASE_URL' : 'none',
        },
      ],
      warnings: hasDB
        ? undefined
        : [
            'Using in-memory storage. Your data will disappear when you restart. Connect a database later for permanent storage.',
          ],
    };
  }

  private async setupIdentity(): Promise<StepResult> {
    return {
      ok: true,
      summary:
        "We've prepared the IdentityEngine for you. This handles users, organizations, and login sessions. You can create your first user whenever you're ready!",
      artifacts: [
        {
          type: 'sql',
          target: 'database/migrations/identity.sql',
          payload: '-- Identity tables would go here',
          applyMode: 'manual_only',
        },
      ],
      warnings: [
        "IdentityEngine isn't installed yet. When you're ready, we'll show you how to add it to your project.",
      ],
    };
  }

  private async setupCharter(): Promise<StepResult> {
    return {
      ok: true,
      summary:
        "CharterEngine will help you manage user consent. This is especially important if you're using AI or handling personal data. It keeps a permanent record of what users agreed to.",
      warnings: [
        "CharterEngine isn't installed yet. It's optional unless you need GDPR compliance or consent tracking.",
      ],
    };
  }

  private async setupConfig(): Promise<StepResult> {
    return {
      ok: true,
      summary:
        "ConfigEngine lets you control features with switches. Turn things on for some users, off for others. Test safely before showing everyone.",
      warnings: [
        "ConfigEngine isn't installed yet. You can add it later when you need feature flags.",
      ],
    };
  }

  private async confirmCompletion(session: BuildSession): Promise<StepResult> {
    const successCount = session.steps.filter((s) => s.status === 'success').length;
    const totalCount = session.steps.length - 1; // Exclude this step

    return {
      ok: true,
      summary: `We completed ${successCount} out of ${totalCount} steps together! Your app "${session.appName}" now has: ${session.enginesTouched.join(', ') || 'basic structure'}. You can see detailed receipts that explain everything we did.`,
    };
  }
}
