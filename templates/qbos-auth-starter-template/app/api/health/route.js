"use strict";
/**
 * Health Check Endpoint
 * Used by QuietBuild OS to verify deployment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
async function GET() {
    return server_1.NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'qbos-auth-starter',
    });
}
//# sourceMappingURL=route.js.map