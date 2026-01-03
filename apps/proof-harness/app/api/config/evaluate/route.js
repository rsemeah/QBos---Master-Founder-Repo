"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const config_engine_core_1 = require("@qbos/config-engine-core");
const configEngine = new config_engine_core_1.ConfigEngine();
async function POST(request) {
    try {
        const body = await request.json();
        const { flagKey, userId, context } = body;
        if (!flagKey) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'flagKey required',
            }, { status: 400 });
        }
        const evaluation = await configEngine.isEnabled(flagKey, { userId, ...context });
        return server_1.NextResponse.json({
            ok: true,
            data: evaluation,
            message: 'Feature flag evaluated via ConfigEngine',
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