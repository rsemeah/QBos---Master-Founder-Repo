"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const execution_engine_core_1 = require("@qbos/execution-engine-core");
// Singleton orchestrator
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
        const { messages, userId, sessionId, maxCost, preferredCapabilities } = body;
        if (!messages || !Array.isArray(messages)) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'messages array required',
            }, { status: 400 });
        }
        if (!userId) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'userId required for AI invocation',
            }, { status: 400 });
        }
        const effectiveSessionId = sessionId || `session_${Date.now()}`;
        // CANONICAL MULTI-ENGINE FLOW via EngineOrchestrator
        const orch = await getOrchestrator();
        const result = await orch.invokeAI({
            sessionId: effectiveSessionId,
            userId,
        }, messages, {
            maxCost,
            preferredCapabilities,
        });
        // Get receipts for TruthSerum validation
        const receiptSystem = orch.getReceiptSystem();
        const receipts = receiptSystem.getReceiptsForSession(effectiveSessionId);
        // Run TruthSerum validation
        const validator = new execution_engine_core_1.TruthSerumValidator();
        const truthReport = validator.validate(effectiveSessionId, receipts);
        return server_1.NextResponse.json({
            ok: result.ok,
            data: result.data,
            error: result.error,
            receipts: result.receipts,
            truthSerum: {
                valid: truthReport.valid,
                enginesInvoked: truthReport.summary.enginesInvoked,
                gatesChecked: truthReport.summary.gatesChecked,
                interactions: truthReport.engineAwarenessMatrix.interactions.length,
                violations: truthReport.orderingViolations,
            },
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