/**
 * POST /api/rob/chat
 * 
 * Rob's chat endpoint with full constitutional pipeline:
 * 1. Auth check
 * 2. Billing cap enforcement
 * 3. Persist user message
 * 4. State transition (LISTENING)
 * 5. SilentEngine invocation
 * 6. TruthSerum validation
 * 7. Persist assistant message
 * 8. Return response
 * 
 * Emits receipts: user_input_received, ai_invoked, message_validated
 */

import { NextRequest, NextResponse } from 'next/server';
import { RobEngine, SupabaseRobPersistence } from '@qbos/execution-engine-core';
import { SilentEngine, MockProvider } from '@qbos/silent-engine-core';
import { autonomyGuard } from '../../../../../apps/robby/src/policy/autonomy.js';

export async function POST(request: NextRequest) {
  try {
    // TODO: Extract user from auth
    const userId = request.headers.get('x-user-id') || 'mock-user-123';

    const body = await request.json();
    const { session_id, message } = body;

    if (!session_id || !message) {
      return NextResponse.json(
        { error: 'session_id and message are required' },
        { status: 400 }
      );
    }

    // Initialize persistence
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const persistence = new SupabaseRobPersistence(supabaseUrl, supabaseKey);
    const robEngine = new RobEngine(persistence);

    // Verify session exists and belongs to user
    const session = await robEngine.getSession(session_id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Step 2: Billing cap enforcement (L2 Autonomy)
    const budgetCap = autonomyGuard.getBudgetCap(); // $5 for L2

    // Get current AI usage cost for this session
    const aiUsage = await persistence.getAIUsageForSession(session_id);
    const currentSpend = aiUsage.reduce((sum, usage) => sum + usage.cost_usd, 0);

    // Check if budget exceeded
    if (currentSpend >= budgetCap) {
      // Emit budget exceeded receipt
      await persistence.addReceipt({
        session_id,
        actor: 'system',
        action_type: 'budget.exceeded',
        outcome: 'blocked',
        evidence_refs: [],
        truth_state: 'Verified',
        metadata: {
          current_spend: currentSpend,
          budget_cap: budgetCap,
          usage_count: aiUsage.length,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'Budget cap exceeded',
          budget_status: {
            current: currentSpend,
            cap: budgetCap,
            percentage: Math.round((currentSpend / budgetCap) * 100),
          },
        },
        { status: 402 } // Payment Required
      );
    }

    // Warn if approaching budget (80% threshold)
    const budgetPercentage = (currentSpend / budgetCap) * 100;
    if (budgetPercentage >= 80 && budgetPercentage < 100) {
      // Emit warning receipt
      await persistence.addReceipt({
        session_id,
        actor: 'system',
        action_type: 'budget.warning',
        outcome: 'success',
        evidence_refs: [],
        truth_state: 'Verified',
        metadata: {
          current_spend: currentSpend,
          budget_cap: budgetCap,
          percentage: Math.round(budgetPercentage),
          threshold: 80,
        },
      });
    }

    // Step 3: Persist user message
    const userMessage = await persistence.addMessage({
      session_id,
      role: 'user',
      content: message,
      metadata: {},
    });

    // Emit receipt
    await persistence.addReceipt({
      session_id,
      actor: 'user',
      action_type: 'user_input_received',
      outcome: 'success',
      evidence_refs: [userMessage.id],
      truth_state: 'Verified',
      metadata: { message_id: userMessage.id },
    });

    // Step 4: State transition
    await robEngine.transitionState(
      session_id,
      'LISTENING',
      'Processing user input',
      userMessage.id
    );

    // Step 5: SilentEngine invocation (mock for now)
    const mockProvider = new MockProvider();
    mockProvider.configure({
      providerKey: 'mock',
      apiKey: 'mock-key',
    });

    const silentEngine = new SilentEngine({
      providers: [mockProvider],
      policies: [
        {
          policyKey: 'default',
          displayName: 'Default',
          description: 'Default policy',
          preferredCapabilities: ['fast_latency'],
          requiredCapabilities: [],
          allowFallback: false,
          requireSafetyCheck: false,
          minSafetyLevel: 'low',
        },
      ],
      defaultPolicyKey: 'default',
    });

    const startTime = Date.now();
    const aiResult = await silentEngine.generate({
      messages: [{ role: 'user', content: message }],
      policyKey: 'default',
      preferredCapabilities: ['fast_latency'],
    });
    const latencyMs = Date.now() - startTime;

    // Step 6: TruthSerum validation
    const truthReport = await robEngine.validateSession(session_id);
    
    // Check if AI's response makes unsupported claims
    let finalResponse = aiResult.response.text;
    const violations: string[] = [];

    // Simple claim detection (in production, this would be more sophisticated)
    const deployedClaims = ['deployed', 'live', 'published'];
    const hasDeployedClaim = deployedClaims.some((claim) =>
      finalResponse.toLowerCase().includes(claim)
    );

    if (hasDeployedClaim) {
      const hasDeployReceipt = truthReport.summary.enginesInvoked.some((e) =>
        ['vercel.deploy_success', 'healthcheck.ok'].includes(e)
      );

      if (!hasDeployReceipt) {
        violations.push('Deployment claim without receipt');
        finalResponse = finalResponse.replace(
          /deployed|live|published/gi,
          'ready to deploy'
        );
      }
    }

    // Step 7: Persist assistant message
    const assistantMessage = await persistence.addMessage({
      session_id,
      role: 'assistant',
      content: finalResponse,
      metadata: {
        truthserum: {
          original: aiResult.response.text,
          rewritten: violations.length > 0,
          violations,
        },
        ai_usage: {
          provider: aiResult.provider,
          model: aiResult.model,
          tokens_in: aiResult.response.tokensInput,
          tokens_out: aiResult.response.tokensOutput,
          latency_ms: latencyMs,
        },
      },
    });

    // Record AI usage
    await persistence.recordAIUsage({
      session_id,
      triggered_by_message_id: assistantMessage.id,
      provider: aiResult.provider,
      model: aiResult.model,
      tokens_in: aiResult.response.tokensInput,
      tokens_out: aiResult.response.tokensOutput,
      cost_usd: aiResult.actualCost,
      latency_ms: latencyMs,
    });

    // Emit receipts
    await persistence.addReceipt({
      session_id,
      actor: 'rob',
      action_type: 'ai.invoked',
      outcome: 'success',
      evidence_refs: [assistantMessage.id],
      truth_state: 'Verified',
      metadata: {
        provider: aiResult.provider,
        model: aiResult.model,
        latency_ms: latencyMs,
      },
    });

    await persistence.addReceipt({
      session_id,
      actor: 'rob',
      action_type: 'message.validated',
      outcome: violations.length > 0 ? 'blocked' : 'success',
      evidence_refs: [assistantMessage.id],
      truth_state: 'Verified',
      metadata: {
        violations,
        rewritten: violations.length > 0,
      },
    });

    // Update progress and readiness
    await robEngine.updateProgressAndReadiness(session_id);

    // Transition back to WAITING
    await robEngine.transitionState(
      session_id,
      'WAITING',
      'Awaiting next user input',
      assistantMessage.id
    );

    // Return response
    return NextResponse.json({
      ok: true,
      message: finalResponse,
      metadata: {
        truthserum: {
          violations,
          rewritten: violations.length > 0,
        },
        session: {
          state: 'WAITING',
          progress: session.progress_percent,
          readiness: session.readiness_tier,
        },
      },
    });
  } catch (error) {
    console.error('Rob chat error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
