"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const identity_engine_core_1 = require("@qbos/identity-engine-core");
const server_1 = require("next/server");
const ReceiptWriter_1 = require("../../../../packages/truthserum/src/ReceiptWriter");
const ALLOWED_SERVER_SIGN_TYPES = [
    'build.session.created',
    'build.step.completed',
    'deployment.triggered',
    'template.applied',
    'generation.completed',
    'github.repo.created',
    'vercel.deployment.completed',
    'healthcheck.passed',
    'delegation.progressed',
    'delegation.reverted'
];
async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return server_1.NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.substring(7);
        const identityEngine = new identity_engine_core_1.IdentityEngine();
        const session = await identityEngine.validateSession(token);
        if (!session || !session.userId) {
            return server_1.NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
        }
        const payload = await req.json();
        if (!payload?.type || !ALLOWED_SERVER_SIGN_TYPES.includes(payload.type)) {
            return server_1.NextResponse.json({ error: 'Unauthorized receipt type', allowedTypes: ALLOWED_SERVER_SIGN_TYPES }, { status: 403 });
        }
        const details = {
            ...payload.details,
            actor: {
                userId: session.userId,
                orgId: session.orgId || null,
                role: session.role || 'user'
            },
            serverSigned: true,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
        };
        const receipt = await ReceiptWriter_1.ReceiptWriter.write({
            sessionId: session.id,
            type: payload.type,
            details
        });
        return server_1.NextResponse.json(receipt);
    }
    catch (error) {
        console.error('[Server-Sign] Error:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map