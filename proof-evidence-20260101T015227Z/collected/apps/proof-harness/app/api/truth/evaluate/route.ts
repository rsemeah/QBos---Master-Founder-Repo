/**
 * TruthSerum evaluation API
 * Returns verdict for a given intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { TruthSerum, ReceiptWriter, IntentsRegistry } from '@qbos/truthserum';

const receiptWriter = new ReceiptWriter({
  localFallbackPath: './proof/local_receipts.jsonl',
});

export async function POST(request: NextRequest) {
  try {
    const { intentId, sessionId } = await request.json();

    if (!intentId) {
      return NextResponse.json(
        { error: 'Missing intentId' },
        { status: 400 }
      );
    }

    const intent = IntentsRegistry[intentId];
    if (!intent) {
      return NextResponse.json(
        { error: `Unknown intent: ${intentId}` },
        { status: 404 }
      );
    }

    // Read receipts
    const receipts = await receiptWriter.readReceipts(sessionId);

    // Evaluate intent
    const evaluation = TruthSerum.evaluateIntent(intent, receipts);

    return NextResponse.json({
      evaluation,
      receiptCount: receipts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Truth evaluation error:', error);
    return NextResponse.json(
      {
        error: 'Evaluation failed',
        state: 'Unknown',
        nextActions: ['Check server logs for details'],
      },
      { status: 500 }
    );
  }
}
