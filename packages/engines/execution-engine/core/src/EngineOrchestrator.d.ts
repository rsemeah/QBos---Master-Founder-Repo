import { EventEmitter } from 'events';
import { ExecutionEngine } from './ExecutionEngine';
import { RobEngine, type RobEnginePersistence } from './RobEngine';
export interface EngineOrchestratorConfig {
    persistence?: RobEnginePersistence;
}
/**
 * EngineOrchestrator coordinates core engines and lifecycle hooks.
 *
 * This lightweight orchestrator avoids hard dependencies on optional infra
 * while still providing a single entrypoint for initialization and shutdown.
 */
export declare class EngineOrchestrator extends EventEmitter {
    readonly executionEngine: ExecutionEngine;
    readonly robEngine: RobEngine;
    private isInitialized;
    constructor(config?: EngineOrchestratorConfig);
    initialize(): Promise<void>;
    init(): Promise<void>;
    shutdown(): Promise<void>;
    getReceiptSystem(): import(".").ReceiptSystem;
    invokeAI(context: {
        sessionId: string;
        userId: string;
    }, messages: Array<{
        role: string;
        content: string;
    }>, options?: {
        maxCost?: number;
        preferredCapabilities?: string[];
    }): Promise<{
        ok: boolean;
        data: {
            message: string;
            response: string;
        };
        receipts: any[];
        error?: string;
    }>;
    createSession(userEmail: string): Promise<{
        ok: boolean;
        data: {
            sessionId: string;
            userId: string;
        };
    }>;
}
//# sourceMappingURL=EngineOrchestrator.d.ts.map