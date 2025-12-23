import { NextRequest, NextResponse } from 'next/server';
import { EngineOrchestrator } from '@qbos/execution-engine-core';

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
    const { email, orgId } = body;

    if (!email) {
      return NextResponse.json({
        ok: false,
        error: 'email required',
      }, { status: 400 });
    }

    const orch = await getOrchestrator();
    const result = await orch.createSession(email, orgId);

    // Get receipts
    const receiptSystem = orch.getReceiptSystem();
    const receipts = result.data?.sessionId
      ? receiptSystem.getReceiptsForSession(result.data.sessionId)
      : [];

    return NextResponse.json({
      ok: result.ok,
      data: result.data,
      error: result.error,
      receipts: result.receipts,
      receiptDetails: receipts.map((r) => ({
        id: r.receipt_id,
        actor: r.actor,
        action: r.action_type,
        outcome: r.outcome,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
