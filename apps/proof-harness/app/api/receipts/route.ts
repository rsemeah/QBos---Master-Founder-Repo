/**
 * Receipts API - Read receipts for a session
 */

import { ReceiptWriter } from '@qbos/truthserum';
import { NextRequest, NextResponse } from 'next/server';

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

    // If incoming payload includes a signature, verify it before accepting.
    if (receiptData && receiptData.sig && receiptData.signerKeyId) {
      const ok = await receiptWriter.verifyReceipt(receiptData);
      if (!ok) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
      // Accept already-signed receipts (append-only)
      const receipt = await receiptWriter.writeReceipt(receiptData);
      return NextResponse.json({ receipt, status: 'written' });
    }

    // For unsigned receipts, the writer will sign then write.
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
