/**
 * SilentEngine™ - Audit Logger
 *
 * In-memory audit trail for routing decisions and executions
 */
import { RoutingDecision, ExecutionResult } from '../types';
export interface AuditLog {
    requestId: string;
    timestamp: Date;
    eventType: 'routing_decision' | 'execution_result' | 'error';
    data: RoutingDecision | ExecutionResult | any;
}
export declare class AuditLogger {
    private logs;
    private maxLogs;
    /**
     * Log routing decision
     */
    logRoutingDecision(decision: RoutingDecision): void;
    /**
     * Log execution result
     */
    logExecutionResult(result: ExecutionResult): void;
    /**
     * Log error
     */
    logError(params: {
        requestId: string;
        error: Error;
        context?: Record<string, any>;
    }): void;
    /**
     * Get logs (for debugging/monitoring)
     */
    getLogs(params?: {
        requestId?: string;
        eventType?: string;
        since?: Date;
        limit?: number;
    }): AuditLog[];
    /**
     * Clear logs
     */
    clear(): void;
    /**
     * Add log with size limit
     */
    private addLog;
}
//# sourceMappingURL=audit-logger.d.ts.map