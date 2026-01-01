import { NextRequest, NextResponse } from 'next/server';
import { EngineOrchestrator, TruthSerumValidator } from '@qbos/execution-engine-core';

// Singleton orchestrator
let orchestrator: EngineOrchestrator | null = null;

async function getOrchestrator(): Promise<EngineOrchestrator> {
  if (!orchestrator) {
    orchestrator = new EngineOrchestrator();
    await orchestrator.init();
  }
  return orchestrator;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userId, sessionId, maxCost, preferredCapabilities } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({
        ok: false,
        error: 'messages array required',
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({
        ok: false,
        error: 'userId required for AI invocation',
      }, { status: 400 });
    }

    const effectiveSessionId = sessionId || `session_${Date.now()}`;

    // CANONICAL MULTI-ENGINE FLOW via EngineOrchestrator
    const orch = await getOrchestrator();
    const result = await orch.invokeAI(
      {
        sessionId: effectiveSessionId,
        userId,
      },
      messages,
      {
        maxCost,
        preferredCapabilities,
      }
    );

    // Get receipts for TruthSerum validation
    const receiptSystem = orch.getReceiptSystem();
    const receipts = receiptSystem.getReceiptsForSession(effectiveSessionId);

    // Run TruthSerum validation
    const validator = new TruthSerumValidator();
    const truthReport = validator.validate(effectiveSessionId, receipts);

    return NextResponse.json({
      ok: result.ok,
      data: result.data,
      error: result.error,
      receipts: result.receipts,
      truthSerum: {
        valid: truthReport.valid,
        enginesInvoked: truthReport.summary.enginesInvoked,
        gatesChecked: truthReport.summary.gatesChecked,
        interactions: truthReport.engineAwarenessMatrix.interactions.length,
        violations: truthReport.orderingViolations,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
