"use strict";
/**
 * Receipts API - Read receipts for a session
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const truthserum_1 = require("@qbos/truthserum");
const server_1 = require("next/server");
const receiptWriter = new truthserum_1.ReceiptWriter({
    localFallbackPath: './proof/local_receipts.jsonl',
});
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId') || undefined;
        const limit = parseInt(searchParams.get('limit') || '100');
        const receipts = await receiptWriter.readReceipts(sessionId);
        return server_1.NextResponse.json({
            receipts: receipts.slice(-limit),
            count: receipts.length,
            sessionId,
        });
    }
    catch (error) {
        console.error('Receipts read error:', error);
        return server_1.NextResponse.json({ error: 'Failed to read receipts' }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const receiptData = await request.json();
        // If incoming payload includes a signature, verify it before accepting.
        if (receiptData && receiptData.sig && receiptData.signerKeyId) {
            const ok = await receiptWriter.verifyReceipt(receiptData);
            if (!ok) {
                return server_1.NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
            // Accept already-signed receipts (append-only)
            const receipt = await receiptWriter.writeReceipt(receiptData);
            return server_1.NextResponse.json({ receipt, status: 'written' });
        }
        // For unsigned receipts, the writer will sign then write.
        const receipt = await receiptWriter.writeReceipt(receiptData);
        return server_1.NextResponse.json({
            receipt,
            status: 'written',
        });
    }
    catch (error) {
        console.error('Receipt write error:', error);
        return server_1.NextResponse.json({ error: 'Failed to write receipt' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map