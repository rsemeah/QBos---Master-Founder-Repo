"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const execution_engine_core_1 = require("@qbos/execution-engine-core");
let orchestrator = null;
async function getOrchestrator() {
    if (!orchestrator) {
        orchestrator = new execution_engine_core_1.EngineOrchestrator();
        await orchestrator.init();
    }
    return orchestrator;
}
async function POST(request) {
    try {
        const body = await request.json();
        const { email, orgId } = body;
        if (!email) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'email required',
            }, { status: 400 });
        }
        const orch = await getOrchestrator();
        const result = await orch.createSession(email);
        // Get receipts
        const receiptSystem = orch.getReceiptSystem();
        const receipts = result.data?.sessionId
            ? receiptSystem.getReceiptsForSession(result.data.sessionId)
            : [];
        return server_1.NextResponse.json({
            ok: result.ok,
            data: result.data,
            receiptDetails: receipts.map((r) => ({
                id: r.receipt_id,
                actor: r.actor,
                action: r.action_type,
                outcome: r.outcome,
            })),
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