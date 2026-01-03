"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const supabase_js_1 = require("@supabase/supabase-js");
const server_1 = require("next/server");
const ReceiptWriter_1 = require("../../../../packages/truthserum/src/ReceiptWriter");
const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
async function POST(req) {
    try {
        const payload = await req.json();
        if (!payload || !payload.signature || !payload.signerKeyId) {
            return server_1.NextResponse.json({ error: 'Missing signature or signerKeyId' }, { status: 400 });
        }
        // Verify signature using ReceiptWriter helper (canonicalization + keystore)
        const valid = await ReceiptWriter_1.ReceiptWriter.verifyReceipt(payload);
        if (!valid) {
            return server_1.NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }
        // Persist receipt into build_receipts (append-only)
        const { data, error } = await supabase.from('build_receipts').insert([
            {
                session_id: payload.sessionId || null,
                type: payload.type || 'unknown',
                details: payload.details || {},
                signature: payload.signature,
                signer_key_id: payload.signerKeyId,
                verification_hash: payload.verification_hash || null,
                created_at: new Date().toISOString()
            }
        ]);
        if (error) {
            console.error('[submit-signed] supabase insert error', error);
            return server_1.NextResponse.json({ error: 'Failed to persist receipt' }, { status: 500 });
        }
        return server_1.NextResponse.json({ ok: true, inserted: data });
    }
    catch (err) {
        console.error('[submit-signed] Error:', err);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map