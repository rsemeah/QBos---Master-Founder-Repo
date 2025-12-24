/**
 * Receipts API - Read receipts for a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReceiptWriter } from '@qbos/truthserum';

const receiptWriter = new ReceiptWriter({
  localFallbackPath: './proof/local_receipts.jsonl',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const receipts = await receiptWriter.readReceipts(sessionId);

    return NextResponse.json({
      receipts: receipts.slice(-limit),
      count: receipts.length,
      sessionId,
    });
  } catch (error) {
    console.error('Receipts read error:', error);
    return NextResponse.json(
      { error: 'Failed to read receipts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const receiptData = await request.json();

    const receipt = await receiptWriter.writeReceipt(receiptData);

    return NextResponse.json({
      receipt,
      status: 'written',
    });
  } catch (error) {
    console.error('Receipt write error:', error);
    return NextResponse.json(
      { error: 'Failed to write receipt' },
      { status: 500 }
    );
  }
}
