"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineOrchestrator = void 0;
const events_1 = require("events");
const ExecutionEngine_1 = require("./ExecutionEngine");
const RobEngine_1 = require("./RobEngine");
/**
 * EngineOrchestrator coordinates core engines and lifecycle hooks.
 *
 * This lightweight orchestrator avoids hard dependencies on optional infra
 * while still providing a single entrypoint for initialization and shutdown.
 */
class EngineOrchestrator extends events_1.EventEmitter {
    executionEngine;
    robEngine;
    isInitialized = false;
    constructor(config = {}) {
        super();
        this.executionEngine = new ExecutionEngine_1.ExecutionEngine();
        this.robEngine = new RobEngine_1.RobEngine(config.persistence);
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        this.isInitialized = true;
        this.emit('initialized');
    }
    async init() {
        await this.initialize();
    }
    async shutdown() {
        if (!this.isInitialized) {
            return;
        }
        this.isInitialized = false;
        this.emit('shutdown');
    }
    getReceiptSystem() {
        return this.robEngine.getReceiptSystem();
    }
    async invokeAI(context, messages, options) {
        const latest = messages[messages.length - 1]?.content ?? '';
        const receiptSystem = this.robEngine.getReceiptSystem();
        receiptSystem.emit({
            session_id: context.sessionId,
            actor: 'rob',
            action_type: 'silent.generated',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: {
                userId: context.userId,
                maxCost: options?.maxCost,
                preferredCapabilities: options?.preferredCapabilities,
            },
        });
        return {
            ok: true,
            data: {
                message: `Status unknown - AI response placeholder: ${latest}`,
                response: `Status unknown - AI response placeholder: ${latest}`,
            },
            receipts: receiptSystem.getReceiptsForSession(context.sessionId),
        };
    }
    async createSession(userEmail) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const userId = `user_${Math.random().toString(36).slice(2, 7)}`;
        const receiptSystem = this.robEngine.getReceiptSystem();
        receiptSystem.emit({
            session_id: sessionId,
            actor: 'user',
            action_type: 'session.created',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: { userEmail },
        });
        return {
            ok: true,
            data: { sessionId, userId },
        };
    }
}
exports.EngineOrchestrator = EngineOrchestrator;
//# sourceMappingURL=EngineOrchestrator.js.map