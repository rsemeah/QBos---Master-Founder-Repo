"use strict";
/**
 * SilentEngine™ - Audit Logger
 *
 * In-memory audit trail for routing decisions and executions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
class AuditLogger {
    logs = [];
    maxLogs = 1000; // In-memory limit
    /**
     * Log routing decision
     */
    logRoutingDecision(decision) {
        this.addLog({
            requestId: decision.timestamp.toISOString(), // Temporary, use actual requestId
            timestamp: decision.timestamp,
            eventType: 'routing_decision',
            data: decision,
        });
    }
    /**
     * Log execution result
     */
    logExecutionResult(result) {
        this.addLog({
            requestId: result.requestId,
            timestamp: new Date(),
            eventType: 'execution_result',
            data: result,
        });
    }
    /**
     * Log error
     */
    logError(params) {
        this.addLog({
            requestId: params.requestId,
            timestamp: new Date(),
            eventType: 'error',
            data: {
                message: params.error.message,
                stack: params.error.stack,
                context: params.context,
            },
        });
    }
    /**
     * Get logs (for debugging/monitoring)
     */
    getLogs(params) {
        let filtered = this.logs;
        if (params?.requestId) {
            filtered = filtered.filter((log) => log.requestId === params.requestId);
        }
        if (params?.eventType) {
            filtered = filtered.filter((log) => log.eventType === params.eventType);
        }
        if (params?.since) {
            filtered = filtered.filter((log) => log.timestamp >= params.since);
        }
        if (params?.limit) {
            filtered = filtered.slice(0, params.limit);
        }
        return filtered;
    }
    /**
     * Clear logs
     */
    clear() {
        this.logs = [];
    }
    /**
     * Add log with size limit
     */
    addLog(log) {
        this.logs.unshift(log); // Add to front
        // Maintain max size
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
    }
}
exports.AuditLogger = AuditLogger;
//# sourceMappingURL=audit-logger.js.map