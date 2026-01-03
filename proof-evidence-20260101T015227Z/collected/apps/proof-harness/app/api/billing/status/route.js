"use strict";
/**
 * Billing Status API - Returns billing state from receipts
 * NO optimistic claims - only what receipts prove
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const truthserum_1 = require("@qbos/truthserum");
exports.dynamic = 'force-dynamic';
const receiptWriter = new truthserum_1.ReceiptWriter({
    localFallbackPath: './proof/local_receipts.jsonl',
});
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        if (!sessionId) {
            return server_1.NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }
        // Read receipts
        const receipts = await receiptWriter.readReceipts(sessionId);
        // Find billing proofs
        const billingActive = receipts.find(r => r.type === 'billing.active');
        const capCheck = receipts.find(r => r.type === 'billing.cap_not_exceeded');
        const capWarning = receipts.find(r => r.type === 'billing.cap_warning');
        let state = 'Unknown';
        const missingProofs = [];
        if (billingActive && capCheck) {
            state = 'Verified';
        }
        else {
            if (!billingActive)
                missingProofs.push('billing.active');
            if (!capCheck)
                missingProofs.push('billing.cap_not_exceeded');
        }
        if (capWarning) {
            state = 'Blocked';
        }
        return server_1.NextResponse.json({
            state,
            billingActive: Boolean(billingActive),
            capExceeded: Boolean(capWarning),
            missingProofs,
            receipts: receipts.filter(r => r.type.startsWith('billing.')),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Billing status error:', error);
        return server_1.NextResponse.json({
            state: 'Unknown',
            error: 'Could not determine billing status',
            nextActions: ['Check server logs', 'Ensure receipts are being written'],
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map