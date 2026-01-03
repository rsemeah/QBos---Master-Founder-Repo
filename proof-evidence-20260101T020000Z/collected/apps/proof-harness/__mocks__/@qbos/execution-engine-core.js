"use strict";
/**
 * Mock for @qbos/execution-engine-core package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineOrchestrator = exports.BuildSession = void 0;
class BuildSession {
    create = jest.fn().mockResolvedValue({
        id: 'session123',
        user_id: 'user123',
        current_state: 'IDEA_CAPTURE',
    });
    matchTemplate = jest.fn().mockResolvedValue({
        template: { id: 'auth-starter', name: 'Auth Starter' },
        confidence: 'high',
    });
}
exports.BuildSession = BuildSession;
class EngineOrchestrator {
    constructor() { }
    start = jest.fn();
    stop = jest.fn();
}
exports.EngineOrchestrator = EngineOrchestrator;
//# sourceMappingURL=execution-engine-core.js.map