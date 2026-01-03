"use strict";
/**
 * StateStore - Session persistence abstraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateStore = void 0;
class StateStore {
    sessions = new Map();
    saveSession(session) {
        this.sessions.set(session.id, { ...session });
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? { ...session } : null;
    }
    hasSession(sessionId) {
        return this.sessions.has(sessionId);
    }
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    getAllSessions() {
        return Array.from(this.sessions.values()).map((s) => ({ ...s }));
    }
}
exports.StateStore = StateStore;
//# sourceMappingURL=stateStore.js.map