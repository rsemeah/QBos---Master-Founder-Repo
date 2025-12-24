/**
 * Session API - Create and manage build sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReceiptWriter } from '@qbos/truthserum';

const receiptWriter = new ReceiptWriter({
  localFallbackPath: './proof/local_receipts.jsonl',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, templateId, appName } = await request.json();

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Write session.created receipt
    await receiptWriter.writeReceipt({
      sessionId,
      type: 'session.created',
      details: {
        userId,
        templateId,
        appName,
        state: 'INIT',
      },
    });

    return NextResponse.json({
      sessionId,
      userId,
      templateId,
      appName,
      state: 'INIT',
      created: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const receipts = await receiptWriter.readReceipts(sessionId);
    const sessionReceipt = receipts.find(r => r.type === 'session.created');

    if (!sessionReceipt) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId,
      ...sessionReceipt.details,
      receiptCount: receipts.length,
    });
  } catch (error) {
    console.error('Session read error:', error);
    return NextResponse.json(
      { error: 'Failed to read session' },
      { status: 500 }
    );
  }
}
