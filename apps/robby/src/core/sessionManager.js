"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const robby_receipt_ts_1 = require("../util/robby-receipt.ts");
const stateMachine_ts_1 = require("./stateMachine.ts");
const RECEIPTS_PATH = path.resolve('receipts/robby/robby.receipts.jsonl');
class SessionManager {
    sessions = new Map();
    createSession(initialGoal) {
        const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const session = {
            id,
            phase: stateMachine_ts_1.RobbyPhase.INTENT,
            state: stateMachine_ts_1.IntentState.COLLECTING,
            intent: initialGoal
                ? { goal: initialGoal, successCriteria: [], scope: { in: [], out: [] }, engines: [], unknowns: [], humanApproved: false }
                : null,
            blockers: []
        };
        this.sessions.set(id, session);
        (0, robby_receipt_ts_1.robbyReceipt)('session.created', { sessionId: id, initialGoal });
        return session;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    submitIntent(sessionId, intent) {
        const s = this.sessions.get(sessionId);
        if (!s)
            throw new Error('session_not_found');
        if (!(0, stateMachine_ts_1.isValidTransition)('INTENT', s.state, 'INTENT', stateMachine_ts_1.IntentState.CONFIRMING)) {
            throw new Error('INVALID_TRANSITION');
        }
        s.intent = { ...intent, humanApproved: false };
        s.state = stateMachine_ts_1.IntentState.CONFIRMING;
        (0, robby_receipt_ts_1.robbyReceipt)('intent.submitted', { sessionId, intent: s.intent });
        return s;
    }
    async approveIntent(sessionId, approved) {
        const s = this.sessions.get(sessionId);
        if (!s)
            throw new Error('session_not_found');
        if (s.state !== stateMachine_ts_1.IntentState.CONFIRMING)
            throw new Error('INVALID_INTENT_STATE');
        if (!approved) {
            s.state = stateMachine_ts_1.IntentState.COLLECTING;
            s.intent = null;
            (0, robby_receipt_ts_1.robbyReceipt)('intent.approval.denied', { sessionId });
            return s;
        }
        // Write an intent.locked receipt (this is required for execution gate)
        const receipt = await (0, robby_receipt_ts_1.robbyReceipt)('intent.locked', { sessionId, approvedBy: 'human' });
        s.intent = { ...(s.intent || {}), humanApproved: true };
        s.state = stateMachine_ts_1.IntentState.LOCKED;
        (0, robby_receipt_ts_1.robbyReceipt)('intent.locked.ack', { sessionId, receiptId: receipt.id });
        return s;
    }
    async execute(sessionId) {
        const s = this.sessions.get(sessionId);
        if (!s)
            throw new Error('session_not_found');
        // Execution gate: check for intent.locked receipt
        const lockedExists = this.checkReceiptExists(sessionId, 'intent.locked');
        if (!lockedExists) {
            s.phase = stateMachine_ts_1.RobbyPhase.EXECUTION;
            s.state = stateMachine_ts_1.ExecutionState.BLOCKED;
            s.blockers = ['intent.locked missing'];
            (0, robby_receipt_ts_1.robbyReceipt)('execution.blocked', { sessionId, reason: 'intent_not_locked' });
            return { status: 'blocked', blockers: s.blockers };
        }
        // Otherwise queue tasks
        s.phase = stateMachine_ts_1.RobbyPhase.EXECUTION;
        s.state = stateMachine_ts_1.ExecutionState.RUNNING;
        s.blockers = [];
        const started = (0, robby_receipt_ts_1.robbyReceipt)('execution.started', { sessionId });
        // For iteration 1 we don't actually run engines; simulate completion
        (0, robby_receipt_ts_1.robbyReceipt)('execution.completed', { sessionId, startedId: started.id });
        s.state = stateMachine_ts_1.ExecutionState.COMPLETED;
        return { status: 'running' };
    }
    getStatus(sessionId) {
        const s = this.sessions.get(sessionId);
        if (!s)
            return { error: 'session_not_found' };
        return {
            sessionId: s.id,
            phase: s.phase,
            state: s.state,
            progress: { tasksTotal: 0, tasksCompleted: 0 },
            blockers: s.blockers,
            nextAction: this.deriveNextAction(s)
        };
    }
    deriveNextAction(s) {
        if (s.phase === stateMachine_ts_1.RobbyPhase.INTENT && s.state === stateMachine_ts_1.IntentState.COLLECTING)
            return 'POST /api/v1/sessions/{id}/intent';
        if (s.phase === stateMachine_ts_1.RobbyPhase.INTENT && s.state === stateMachine_ts_1.IntentState.CONFIRMING)
            return 'POST /api/v1/sessions/{id}/intent/approve';
        if (s.phase === stateMachine_ts_1.RobbyPhase.INTENT && s.state === stateMachine_ts_1.IntentState.LOCKED)
            return 'POST /api/v1/sessions/{id}/execute';
        if (s.phase === stateMachine_ts_1.RobbyPhase.EXECUTION && s.state === stateMachine_ts_1.ExecutionState.BLOCKED)
            return null;
        return null;
    }
    checkReceiptExists(sessionId, type) {
        try {
            if (!fs.existsSync(RECEIPTS_PATH))
                return false;
            const lines = fs.readFileSync(RECEIPTS_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
            return lines.map(l => {
                try {
                    return JSON.parse(l);
                }
                catch {
                    return null;
                }
            }).filter(Boolean).some((r) => r.type === type && r.payload && (r.payload.sessionId === sessionId || r.payload.sessionId === undefined));
        }
        catch (e) {
            return false;
        }
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=sessionManager.js.map