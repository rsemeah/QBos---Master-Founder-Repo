"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const sight_engine_1 = require("@qbos/sight-engine");
async function POST(request) {
    try {
        const body = await request.json();
        const { assetType, tier, spec } = body;
        // SightEngine is optional/non-blocking
        const sightEnabled = process.env.SIGHT_ENGINE_ENABLED !== 'false';
        if (!sightEnabled) {
            return server_1.NextResponse.json({
                ok: true,
                tracked: false,
                warning: 'SightEngine disabled',
            });
        }
        if (!assetType || !tier) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'assetType and tier required',
            }, { status: 400 });
        }
        // Validate asset spec
        const validation = (0, sight_engine_1.validateAsset)(spec, assetType, tier);
        const qualityScore = (0, sight_engine_1.calculateQualityScore)(spec, tier);
        return server_1.NextResponse.json({
            ok: true,
            tracked: true,
            data: {
                validation,
                qualityScore,
                meetsStandards: validation.passed,
            },
            message: 'Visual quality validated via SightEngine',
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