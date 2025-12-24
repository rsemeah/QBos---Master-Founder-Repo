/**
 * Chat API - TruthSerum-first chat endpoint
 * Pipeline: auth → billing → persist user message → evaluate intent → AI generate → sanitize → persist
 */

import { NextRequest, NextResponse } from 'next/server';
import { TruthSerum, ReceiptWriter, IntentsRegistry, Receipt } from '@qbos/truthserum';

const receiptWriter = new ReceiptWriter({
  localFallbackPath: './proof/local_receipts.jsonl',
});

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, userId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing message or sessionId' },
        { status: 400 }
      );
    }

    // Step 1: Write user message receipt
    await receiptWriter.writeReceipt({
      sessionId,
      type: 'chat.user_message' as any,
      details: { message, userId },
    });

    // Step 2: Read all receipts for session
    const receipts = await receiptWriter.readReceipts(sessionId);

    // Step 3: Evaluate session.ready intent
    const sessionReadyEval = TruthSerum.evaluateIntent(
      IntentsRegistry['session.ready'],
      receipts
    );

    // Step 4: If not ready, return truthful response
    if (sessionReadyEval.state !== 'Verified') {
      const response = buildNotReadyResponse(sessionReadyEval);
      
      await receiptWriter.writeReceipt({
        sessionId,
        type: 'chat.assistant_message' as any,
        details: { 
          message: response.message,
          state: sessionReadyEval.state,
          missingProofs: sessionReadyEval.missingProofs,
        },
      });

      return NextResponse.json(response);
    }

    // Step 5: Generate AI response (mock for now - integrate SilentEngine)
    const draftResponse = `I'll help you with that. Let me ${message.toLowerCase().includes('build') ? 'start building' : 'assist you'}.`;

    // Step 6: Sanitize with TruthSerum
    const verdict = TruthSerum.sanitizeClaims(draftResponse, receipts, 'Unknown');

    const finalResponse = verdict.sanitizedText || draftResponse;

    // Step 7: Write assistant message receipt
    await receiptWriter.writeReceipt({
      sessionId,
      type: 'chat.assistant_message' as any,
      details: {
        message: finalResponse,
        sanitized: verdict.sanitizedText !== undefined,
        missingProofs: verdict.missingProofs,
      },
    });

    return NextResponse.json({
      message: finalResponse,
      state: verdict.state,
      missingProofs: verdict.missingProofs,
      nextActions: verdict.nextActions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        message: 'Status unknown - error processing message',
        error: 'Processing failed',
        nextActions: ['Try again or check server logs'],
      },
      { status: 500 }
    );
  }
}

function buildNotReadyResponse(evaluation: any) {
  const missingSteps = evaluation.nextSteps.map((step: string) => 
    step.replace('Obtain proof: ', '').split(' - ')[0]
  );

  return {
    message: `I'd love to help, but I need a few things first:\n\n${
      evaluation.nextSteps.map((step: string, i: number) => 
        `${i + 1}. ${step.split(' - ')[1] || step}`
      ).join('\n')
    }\n\nLet's get those sorted first!`,
    state: evaluation.state,
    missingProofs: missingSteps,
    nextActions: evaluation.nextSteps,
  };
}
