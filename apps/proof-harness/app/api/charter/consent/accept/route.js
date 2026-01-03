"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const charter_engine_core_1 = require("@qbos/charter-engine-core");
const charterEngine = new charter_engine_core_1.CharterEngine();
async function POST(request) {
    try {
        const body = await request.json();
        const { userId, purpose } = body;
        if (!userId || !purpose) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'userId and purpose required',
            }, { status: 400 });
        }
        const record = await charterEngine.grantConsent(userId, purpose, {
            ipAddress: request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });
        return server_1.NextResponse.json({
            ok: true,
            data: record,
            message: 'Consent granted via CharterEngine',
        });
    }
    catch (error) {
        return server_1.NextResponse.json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map