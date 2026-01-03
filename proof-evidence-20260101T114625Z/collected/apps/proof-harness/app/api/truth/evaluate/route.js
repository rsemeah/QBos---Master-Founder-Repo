"use strict";
/**
 * TruthSerum evaluation API
 * Returns verdict for a given intent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const truthserum_1 = require("@qbos/truthserum");
const receiptWriter = new truthserum_1.ReceiptWriter({
    localFallbackPath: './proof/local_receipts.jsonl',
});
async function POST(request) {
    try {
        const { intentId, sessionId } = await request.json();
        if (!intentId) {
            return server_1.NextResponse.json({ error: 'Missing intentId' }, { status: 400 });
        }
        const intent = truthserum_1.IntentsRegistry[intentId];
        if (!intent) {
            return server_1.NextResponse.json({ error: `Unknown intent: ${intentId}` }, { status: 404 });
        }
        // Read receipts
        const receipts = await receiptWriter.readReceipts(sessionId);
        // Evaluate intent
        const evaluation = truthserum_1.TruthSerum.evaluateIntent(intent, receipts);
        return server_1.NextResponse.json({
            evaluation,
            receiptCount: receipts.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Truth evaluation error:', error);
        return server_1.NextResponse.json({
            error: 'Evaluation failed',
            state: 'Unknown',
            nextActions: ['Check server logs for details'],
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map