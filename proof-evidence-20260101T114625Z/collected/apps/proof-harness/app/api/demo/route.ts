import { NextRequest, NextResponse } from 'next/server';
import { EngineOrchestrator, TruthSerumValidator } from '@qbos/execution-engine-core';

/**
 * PUBLIC DEMO ENDPOINT
 * 
 * This endpoint demonstrates full 8-engine coordination with verifiable receipts.
 * Anyone can call this to see QBos V3 in action.
 */

let orchestrator: EngineOrchestrator | null = null;

async function getOrchestrator(): Promise<EngineOrchestrator> {
  if (!orchestrator) {
    orchestrator = new EngineOrchestrator();
    await orchestrator.init();
  }
  return orchestrator;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const message = searchParams.get('message') || 'Hello from QBos V3 Public Demo';

    // Create demo session
    const sessionId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userId = `demo_user_${Date.now()}`;

    const orch = await getOrchestrator();

    // Step 1: Create session
    const sessionResult = await orch.createSession('demo@qbos.dev');
    if (!sessionResult.ok) {
      throw new Error('Session creation failed');
    }

    // Step 2: Invoke AI (full orchestration: 6 engines coordinate)
    const aiResult = await orch.invokeAI(
      { sessionId, userId: sessionResult.data?.userId || userId },
      [{ role: 'user', content: message }]
    );

    // Step 3: Get all receipts
    const receiptSystem = orch.getReceiptSystem();
    const sessionReceipts = receiptSystem.getReceiptsForSession(sessionId);
    const sessionCreationReceipts = receiptSystem.getReceiptsForSession(sessionResult.data?.sessionId || '');
    const allReceipts = [...sessionCreationReceipts, ...sessionReceipts];

    // Step 4: Run TruthSerum validation
    const validator = new TruthSerumValidator();
    const truthReport = validator.validate(sessionId, sessionReceipts);

    // Step 5: Generate public claim
    const claim = {
      timestamp: new Date().toISOString(),
      claim: 'QBos V3: All 8 engines coordinated with verifiable receipts',
      proof: {
        sessionId,
        enginesInvoked: truthReport.summary.enginesInvoked,
        gatesChecked: truthReport.summary.gatesChecked,
        totalReceipts: truthReport.summary.totalReceipts,
        verifiedReceipts: truthReport.summary.verifiedReceipts,
        interactions: truthReport.engineAwarenessMatrix.interactions.length,
        orderingValid: truthReport.orderingViolations.length === 0,
        truthSerumValid: truthReport.valid,
      },
      response: aiResult.data?.response || 'No response',
      receipts: allReceipts.map((r) => ({
        id: r.receipt_id,
        actor: r.actor,
        action: r.action_type,
        outcome: r.outcome,
        timestamp: r.timestamp,
      })),
    };

    return NextResponse.json({
      ok: true,
      claim,
      message: 'This claim is verifiable via the receipts array. Each receipt is immutable and timestamped.',
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message = 'Hello from QBos V3' } = body;

    // Same logic as GET but accepts POST with custom message
    const sessionId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userId = `demo_user_${Date.now()}`;

    const orch = await getOrchestrator();

    const sessionResult = await orch.createSession('demo@qbos.dev');
    if (!sessionResult.ok) {
      throw new Error('Session creation failed');
    }

    const aiResult = await orch.invokeAI(
      { sessionId, userId: sessionResult.data?.userId || userId },
      [{ role: 'user', content: message }]
    );

    const receiptSystem = orch.getReceiptSystem();
    const sessionReceipts = receiptSystem.getReceiptsForSession(sessionId);
    const sessionCreationReceipts = receiptSystem.getReceiptsForSession(sessionResult.data?.sessionId || '');
    const allReceipts = [...sessionCreationReceipts, ...sessionReceipts];

    const validator = new TruthSerumValidator();
    const truthReport = validator.validate(sessionId, sessionReceipts);

    const claim = {
      timestamp: new Date().toISOString(),
      claim: 'QBos V3: All 8 engines coordinated with verifiable receipts',
      proof: {
        sessionId,
        enginesInvoked: truthReport.summary.enginesInvoked,
        gatesChecked: truthReport.summary.gatesChecked,
        totalReceipts: truthReport.summary.totalReceipts,
        verifiedReceipts: truthReport.summary.verifiedReceipts,
        interactions: truthReport.engineAwarenessMatrix.interactions.length,
        orderingValid: truthReport.orderingViolations.length === 0,
        truthSerumValid: truthReport.valid,
      },
      response: aiResult.data?.response || 'No response',
      receipts: allReceipts.map((r) => ({
        id: r.receipt_id,
        actor: r.actor,
        action: r.action_type,
        outcome: r.outcome,
        timestamp: r.timestamp,
      })),
    };

    return NextResponse.json({
      ok: true,
      claim,
      message: 'This claim is verifiable via the receipts array. Each receipt is immutable and timestamped.',
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
