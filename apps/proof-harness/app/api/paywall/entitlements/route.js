"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const paywall_engine_core_1 = require("@qbos/paywall-engine-core");
const paywallEngine = new paywall_engine_core_1.PaywallEngine();
async function POST(request) {
    try {
        const body = await request.json();
        const { userId, orgId } = body;
        if (!userId && !orgId) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'userId or orgId required',
            }, { status: 400 });
        }
        const entitlements = await paywallEngine.getEntitlements(userId, orgId);
        return server_1.NextResponse.json({
            ok: true,
            data: entitlements,
            message: 'Entitlements retrieved via PaywallEngine',
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