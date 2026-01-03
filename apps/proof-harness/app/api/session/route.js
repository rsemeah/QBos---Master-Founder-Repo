"use strict";
/**
 * Session API - Create and manage build sessions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const truthserum_1 = require("@qbos/truthserum");
const receiptWriter = new truthserum_1.ReceiptWriter({
    localFallbackPath: './proof/local_receipts.jsonl',
});
async function POST(request) {
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
        return server_1.NextResponse.json({
            sessionId,
            userId,
            templateId,
            appName,
            state: 'INIT',
            created: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Session creation error:', error);
        return server_1.NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        if (!sessionId) {
            return server_1.NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }
        const receipts = await receiptWriter.readReceipts(sessionId);
        const sessionReceipt = receipts.find(r => r.type === 'session.created');
        if (!sessionReceipt) {
            return server_1.NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        return server_1.NextResponse.json({
            sessionId,
            ...sessionReceipt.details,
            receiptCount: receipts.length,
        });
    }
    catch (error) {
        console.error('Session read error:', error);
        return server_1.NextResponse.json({ error: 'Failed to read session' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map