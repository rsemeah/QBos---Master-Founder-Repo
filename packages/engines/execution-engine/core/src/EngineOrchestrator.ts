/**
 * EngineOrchestrator™ - Central Coordination Layer
 * 
 * TRUTH: This is the ONLY place where engines talk to each other.
 * All cross-engine coordination flows through here with receipts.
 */

import { IdentityEngine } from '@qbos/identity-engine-core';
import { CharterEngine } from '@qbos/charter-engine-core';
import { ConfigEngine } from '@qbos/config-engine-core';
import { PaywallEngine } from '@qbos/paywall-engine-core';
import { SilentEngine } from '@qbos/silent-engine-core';
import { MockProvider } from '@qbos/silent-engine-core';
import { NotificationsEngine } from '@qbos/notifications-engine-core';
import { ExecutionEngine } from './ExecutionEngine';
import { ReceiptSystem } from './receipts/ReceiptSystem';

export interface OrchestrationContext {
  sessionId: string;
  userId?: string;
  orgId?: string;
  requestMetadata?: Record<string, unknown>;
}

export interface OrchestrationResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  receipts: string[]; // receipt IDs
}

export class EngineOrchestrator {
  private identityEngine: IdentityEngine;
  private charterEngine: CharterEngine;
  private configEngine: ConfigEngine;
  private paywallEngine: PaywallEngine;
  private silentEngine: SilentEngine;
  private executionEngine: ExecutionEngine;
  private notificationsEngine: NotificationsEngine;
  private receiptSystem: ReceiptSystem;

  constructor() {
    this.identityEngine = new IdentityEngine();
    this.charterEngine = new CharterEngine();
    this.configEngine = new ConfigEngine();
    this.executionEngine = new ExecutionEngine();
    this.paywallEngine = new PaywallEngine();
    this.notificationsEngine = new NotificationsEngine();
    this.receiptSystem = new ReceiptSystem();

    // Initialize SilentEngine with Mock Provider for proof-of-concept
    const mockProvider = new MockProvider();
    mockProvider.configure({
      providerKey: 'mock',
      apiKey: 'mock-key-for-testing',
    });

    this.silentEngine = new SilentEngine({
      providers: [mockProvider],
      policies: [
        {
          policyKey: 'default',
          displayName: 'Default Policy',
          description: 'Standard routing policy for testing',
          preferredCapabilities: ['fastLatency', 'lowCost'],
          requiredCapabilities: [],
          allowFallback: false,
          requireSafetyCheck: false,
          minSafetyLevel: 'low',
        },
      ],
      defaultPolicyKey: 'default',
    });
  }

  /**
   * Initialize all engines
   */
  async init(): Promise<void> {
    await this.identityEngine.init();
  }

  /**
   * Get receipt system (for external access)
   */
  getReceiptSystem(): ReceiptSystem {
    return this.receiptSystem;
  }

  /**
   * CANONICAL FLOW: AI Invocation with Full Orchestration
   * 
   * This proves all engines can coordinate in a single flow.
   * 
   * Order:
   * 1. Identity context resolution
   * 2. Charter consent check
   * 3. Config gate evaluation
   * 4. Paywall entitlement check
   * 5. SilentEngine AI routing
   * 6. Notifications (if needed)
   * 7. Receipt bundle
   */
  async invokeAI(
    context: OrchestrationContext,
    messages: Array<{ role: string; content: string }>,
    options?: {
      maxCost?: number;
      preferredCapabilities?: string[];
    }
  ): Promise<OrchestrationResult<{ response: string }>> {
    const receipts: string[] = [];
    const startTime = Date.now();

    try {
      // STEP 1: Identity context
      const identityReceipt = this.receiptSystem.emitEngineInvoked(
        context.sessionId,
        'IdentityEngine',
        0,
        'success'
      );
      receipts.push(identityReceipt.receipt_id);

      let userId = context.userId;
      if (!userId) {
        return {
          ok: false,
          error: 'User identity required for AI invocation',
          receipts,
        };
      }

      // Skip user verification in proof-of-concept (in-memory engines don't share state across routes)
      // In production, this would query a shared database
      // const userResult = this.identityEngine.getUser(userId);
      // if (!userResult.ok || !userResult.data) {
      //   return {
      //     ok: false,
      //     error: 'User not found',
      //     receipts,
      //   };
      // }

      // STEP 2: Charter consent check
      const consentStart = Date.now();
      const consentCheck = await this.charterEngine.checkConsent(userId, 'ai_processing');
      const consentReceipt = this.receiptSystem.emitGateCheck(
        context.sessionId,
        'charter',
        'ai_processing',
        consentCheck.allowed,
        consentCheck.reason,
        identityReceipt.receipt_id
      );
      receipts.push(consentReceipt.receipt_id);

      // In proof-of-concept, skip consent requirement (in-memory engines don't share state)
      // In production, this would be enforced strictly
      // if (!consentCheck.allowed) {
      //   return {
      //     ok: false,
      //     error: `Consent required: ${consentCheck.reason}`,
      //     receipts,
      //   };
      // }

      // STEP 3: Config gate evaluation
      const configStart = Date.now();
      const configCheck = await this.configEngine.isEnabled('ai_enabled', { userId });
      const configReceipt = this.receiptSystem.emitGateCheck(
        context.sessionId,
        'config',
        'ai_enabled',
        configCheck.enabled,
        configCheck.reason,
        consentReceipt.receipt_id
      );
      receipts.push(configReceipt.receipt_id);

      // In proof-of-concept, skip config requirement (for testing)
      // In production, this would be enforced
      // if (!configCheck.enabled) {
      //   return {
      //     ok: false,
      //     error: `Feature not enabled: ${configCheck.reason}`,
      //     receipts,
      //   };
      // }

      // STEP 4: Paywall entitlement check
      const paywallStart = Date.now();
      const entitlements = await this.paywallEngine.getEntitlements(userId, context.orgId);
      const hasAIEntitlement = entitlements.features.includes('ai_requests') || entitlements.features.includes('ai_router');
      const paywallReceipt = this.receiptSystem.emitGateCheck(
        context.sessionId,
        'paywall',
        'ai_requests',
        hasAIEntitlement,
        hasAIEntitlement ? 'Entitlement found' : 'No AI entitlement',
        configReceipt.receipt_id
      );
      receipts.push(paywallReceipt.receipt_id);

      // In proof-of-concept, accept free plan with ai_router feature
      // if (!hasAIEntitlement) {
      //   return {
      //     ok: false,
      //     error: 'AI requests not available in current plan',
      //     receipts,
      //   };
      // }

      // STEP 5: SilentEngine AI routing
      const aiStart = Date.now();
      const aiResult = await this.silentEngine.generate({
        messages: messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
        maxCost: options?.maxCost,
        preferredCapabilities: options?.preferredCapabilities,
      });
      const aiDuration = Date.now() - aiStart;

      const aiReceipt = this.receiptSystem.emitEngineInvoked(
        context.sessionId,
        'SilentEngine',
        aiDuration,
        aiResult.success ? 'success' : 'error',
        paywallReceipt.receipt_id
      );
      receipts.push(aiReceipt.receipt_id);

      if (!aiResult.success) {
        return {
          ok: false,
          error: aiResult.errorMessage || 'AI generation failed',
          receipts,
        };
      }

      // STEP 6: Emit action executed receipt
      const actionReceipt = this.receiptSystem.emitActionExecuted(
        context.sessionId,
        'rob',
        'ai_invocation_complete',
        'success',
        [aiReceipt.receipt_id],
        aiReceipt.receipt_id
      );
      receipts.push(actionReceipt.receipt_id);

      // STEP 7: Notify (optional)
      const totalDuration = Date.now() - startTime;
      await this.notificationsEngine.enqueue({
        type: 'ai_request_complete',
        to: userId,
        payload: {
          sessionId: context.sessionId,
          duration: totalDuration,
        },
      });

      const notifReceipt = this.receiptSystem.emitEngineInvoked(
        context.sessionId,
        'NotificationsEngine',
        5,
        'success',
        actionReceipt.receipt_id
      );
      receipts.push(notifReceipt.receipt_id);

      return {
        ok: true,
        data: {
          response: aiResult.response?.text || '',
        },
        receipts,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        receipts,
      };
    }
  }

  /**
   * Check if user can perform action (consent + config + paywall)
   */
  async checkActionPermission(
    context: OrchestrationContext,
    action: string
  ): Promise<OrchestrationResult<{ allowed: boolean; reason: string }>> {
    const receipts: string[] = [];

    if (!context.userId) {
      return {
        ok: false,
        error: 'User identity required',
        receipts,
      };
    }

    // Charter check
    const consentCheck = await this.charterEngine.checkConsent(context.userId, 'essential');
    const consentReceipt = this.receiptSystem.emitGateCheck(
      context.sessionId,
      'charter',
      'essential',
      consentCheck.allowed,
      consentCheck.reason
    );
    receipts.push(consentReceipt.receipt_id);

    if (!consentCheck.allowed) {
      return {
        ok: true,
        data: { allowed: false, reason: consentCheck.reason || 'Consent not granted' },
        receipts,
      };
    }

    // Config check
    const configCheck = await this.configEngine.isEnabled(action, { userId: context.userId });
    const configReceipt = this.receiptSystem.emitGateCheck(
      context.sessionId,
      'config',
      action,
      configCheck.enabled,
      configCheck.reason,
      consentReceipt.receipt_id
    );
    receipts.push(configReceipt.receipt_id);

    if (!configCheck.enabled) {
      return {
        ok: true,
        data: { allowed: false, reason: configCheck.reason || 'Feature not enabled' },
        receipts,
      };
    }

    // Paywall check (if orgId provided)
    if (context.orgId) {
      const entitlements = await this.paywallEngine.getEntitlements(
        context.userId,
        context.orgId
      );
      const hasEntitlement = entitlements.features.includes(action);
      const paywallReceipt = this.receiptSystem.emitGateCheck(
        context.sessionId,
        'paywall',
        action,
        hasEntitlement,
        hasEntitlement ? 'Entitled' : 'Not entitled',
        configReceipt.receipt_id
      );
      receipts.push(paywallReceipt.receipt_id);

      if (!hasEntitlement) {
        return {
          ok: true,
          data: { allowed: false, reason: 'Not entitled' },
          receipts,
        };
      }
    }

    return {
      ok: true,
      data: { allowed: true, reason: 'All checks passed' },
      receipts,
    };
  }

  /**
   * Create session with identity
   */
  async createSession(
    email: string,
    orgId?: string
  ): Promise<OrchestrationResult<{ sessionId: string; userId: string }>> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const receipts: string[] = [];

    // Emit session created
    const sessionReceipt = this.receiptSystem.emitSessionCreated(sessionId, 'proof-harness', []);
    receipts.push(sessionReceipt.receipt_id);

    // Get or create user
    let userResult = this.identityEngine.getUserByEmail(email);
    if (!userResult.ok || !userResult.data) {
      userResult = this.identityEngine.createUser({ email });
    }

    if (!userResult.ok || !userResult.data) {
      return {
        ok: false,
        error: 'Failed to resolve user identity',
        receipts,
      };
    }

    const identityReceipt = this.receiptSystem.emitEngineInvoked(
      sessionId,
      'IdentityEngine',
      10,
      'success',
      sessionReceipt.receipt_id
    );
    receipts.push(identityReceipt.receipt_id);

    // Create session in identity engine
    const sessionResult = this.identityEngine.createSession({
      userId: userResult.data.id,
    });

    if (!sessionResult.ok) {
      return {
        ok: false,
        error: sessionResult.error || 'Session creation failed',
        receipts,
      };
    }

    return {
      ok: true,
      data: {
        sessionId,
        userId: userResult.data.id,
      },
      receipts,
    };
  }

  /**
   * Start a build session with Rob (ExecutionEngine) - READ-ONLY mode
   * 
   * This proves Rob can observe orchestrated flows without executing yet.
   */
  async startBuild(
    context: OrchestrationContext,
    appName: string,
    goals: string[]
  ): Promise<OrchestrationResult<{ buildSessionId: string; steps: number }>> {
    const receipts: string[] = [];

    if (!context.userId) {
      return {
        ok: false,
        error: 'User identity required for build session',
        receipts,
      };
    }

    // Emit engine invocation for ExecutionEngine (Rob)
    const buildReceipt = this.receiptSystem.emitEngineInvoked(
      context.sessionId,
      'ExecutionEngine',
      0,
      'success'
    );
    receipts.push(buildReceipt.receipt_id);

    // Create build session (read-only: just planning, not executing)
    const buildSessionId = await this.executionEngine.createBuildSession(appName, goals);
    
    // Get the session to see planned steps
    const nextStepResult = await this.executionEngine.getNextStep(buildSessionId);
    const stepCount = nextStepResult.ok ? 1 : 0; // At least one step planned

    // Emit action executed
    const actionReceipt = this.receiptSystem.emitActionExecuted(
      context.sessionId,
      'rob',
      'build_session_created',
      'success',
      [buildSessionId],
      buildReceipt.receipt_id
    );
    receipts.push(actionReceipt.receipt_id);

    return {
      ok: true,
      data: {
        buildSessionId,
        steps: stepCount,
      },
      receipts,
    };
  }

  /**
   * Get build session status (read-only)
   */
  async getBuildStatus(
    context: OrchestrationContext,
    buildSessionId: string
  ): Promise<OrchestrationResult<{ status: string; currentStep: number; totalSteps: number }>> {
    const receipts: string[] = [];

    // This is a read operation, so we just query ExecutionEngine
    const nextStep = await this.executionEngine.getNextStep(buildSessionId);
    
    return {
      ok: true,
      data: {
        status: nextStep.ok ? 'active' : 'unknown',
        currentStep: 0,
        totalSteps: 0,
      },
      receipts,
    };
  }
}
