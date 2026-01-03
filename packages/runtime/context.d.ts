/**
 * Runtime Context - Session and user info for orchestration
 */
import { Receipt } from "@qbos/truthserum";
export interface RuntimeContext {
    sessionId: string;
    userId?: string;
    userEmail?: string;
    receipts: Receipt[];
    currentState?: string;
    appConfig?: Record<string, any>;
}
export interface EngineDefinition {
    key: string;
    name: string;
    description: string;
    status: "active" | "beta" | "planned";
    receiptTypes: string[];
}
export declare const EngineRegistry: Record<string, EngineDefinition>;
export declare function getEngine(key: string): EngineDefinition | undefined;
export declare function listEngines(): EngineDefinition[];
//# sourceMappingURL=context.d.ts.map