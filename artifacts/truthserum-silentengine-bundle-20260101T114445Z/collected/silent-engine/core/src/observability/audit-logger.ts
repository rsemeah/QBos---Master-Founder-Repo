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

export class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs: number = 1000; // In-memory limit

  /**
   * Log routing decision
   */
  logRoutingDecision(decision: RoutingDecision): void {
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
  logExecutionResult(result: ExecutionResult): void {
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
  logError(params: { requestId: string; error: Error; context?: Record<string, any> }): void {
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
  getLogs(params?: {
    requestId?: string;
    eventType?: string;
    since?: Date;
    limit?: number;
  }): AuditLog[] {
    let filtered = this.logs;

    if (params?.requestId) {
      filtered = filtered.filter((log) => log.requestId === params.requestId);
    }

    if (params?.eventType) {
      filtered = filtered.filter((log) => log.eventType === params.eventType);
    }

    if (params?.since) {
      filtered = filtered.filter((log) => log.timestamp >= params.since!);
    }

    if (params?.limit) {
      filtered = filtered.slice(0, params.limit);
    }

    return filtered;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Add log with size limit
   */
  private addLog(log: AuditLog): void {
    this.logs.unshift(log); // Add to front

    // Maintain max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }
}
