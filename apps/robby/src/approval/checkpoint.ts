/**
 * Approval Checkpoint System
 *
 * Manages human-in-the-loop approvals for Level 2 autonomy
 */

import { ReceiptWriter } from '../../../packages/truthserum/src/ReceiptWriter.js'

export interface CheckpointRequest {
  id: string
  sessionId: string
  type: 'sprint_start' | 'step_limit' | 'cost_overrun' | 'scope_change'
  context: {
    description: string
    current_step?: number
    total_steps?: number
    current_cost?: number
    budget_cap?: number
    feature?: string
  }
  status: 'pending' | 'approved' | 'denied' | 'timeout'
  requestedAt: string
  resolvedAt?: string
  approvedBy?: string
  reason?: string
}

export class CheckpointManager {
  private checkpoints: Map<string, CheckpointRequest> = new Map()
  private defaultTimeout: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Request checkpoint approval
   * Returns checkpoint ID for tracking
   */
  async requestApproval(
    sessionId: string,
    type: CheckpointRequest['type'],
    context: CheckpointRequest['context']
  ): Promise<string> {
    const checkpointId = this.generateCheckpointId()

    const checkpoint: CheckpointRequest = {
      id: checkpointId,
      sessionId,
      type,
      context,
      status: 'pending',
      requestedAt: new Date().toISOString()
    }

    this.checkpoints.set(checkpointId, checkpoint)

    // Emit receipt for approval request
    await ReceiptWriter.writeReceipt({
      sessionId,
      type: 'approval.requested',
      details: {
        checkpoint_id: checkpointId,
        approval_type: type,
        context
      }
    })

    // Set timeout for auto-rejection
    setTimeout(() => {
      this.timeoutCheckpoint(checkpointId)
    }, this.defaultTimeout)

    return checkpointId
  }

  /**
   * Approve a checkpoint
   */
  async approve(checkpointId: string, approvedBy: string, reason?: string): Promise<boolean> {
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint) return false
    if (checkpoint.status !== 'pending') return false

    checkpoint.status = 'approved'
    checkpoint.resolvedAt = new Date().toISOString()
    checkpoint.approvedBy = approvedBy
    checkpoint.reason = reason

    // Emit receipt for approval
    await ReceiptWriter.writeReceipt({
      sessionId: checkpoint.sessionId,
      type: 'approval.granted',
      details: {
        checkpoint_id: checkpointId,
        approval_type: checkpoint.type,
        approved_by: approvedBy,
        reason
      }
    })

    return true
  }

  /**
   * Deny a checkpoint
   */
  async deny(checkpointId: string, deniedBy: string, reason: string): Promise<boolean> {
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint) return false
    if (checkpoint.status !== 'pending') return false

    checkpoint.status = 'denied'
    checkpoint.resolvedAt = new Date().toISOString()
    checkpoint.approvedBy = deniedBy
    checkpoint.reason = reason

    // Emit receipt for denial
    await ReceiptWriter.writeReceipt({
      sessionId: checkpoint.sessionId,
      type: 'approval.denied',
      details: {
        checkpoint_id: checkpointId,
        approval_type: checkpoint.type,
        denied_by: deniedBy,
        reason
      }
    })

    return true
  }

  /**
   * Wait for checkpoint approval
   * Returns true if approved, false if denied/timeout
   */
  async waitForApproval(checkpointId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const checkpoint = this.checkpoints.get(checkpointId)
        if (!checkpoint) {
          clearInterval(interval)
          resolve(false)
          return
        }

        if (checkpoint.status === 'approved') {
          clearInterval(interval)
          resolve(true)
        } else if (checkpoint.status === 'denied' || checkpoint.status === 'timeout') {
          clearInterval(interval)
          resolve(false)
        }
      }, 500) // Check every 500ms
    })
  }

  /**
   * Get checkpoint status
   */
  getCheckpoint(checkpointId: string): CheckpointRequest | undefined {
    return this.checkpoints.get(checkpointId)
  }

  /**
   * Get all pending checkpoints for a session
   */
  getPendingCheckpoints(sessionId: string): CheckpointRequest[] {
    return Array.from(this.checkpoints.values()).filter(
      (cp) => cp.sessionId === sessionId && cp.status === 'pending'
    )
  }

  /**
   * Auto-reject checkpoint on timeout
   */
  private async timeoutCheckpoint(checkpointId: string): Promise<void> {
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint || checkpoint.status !== 'pending') return

    checkpoint.status = 'timeout'
    checkpoint.resolvedAt = new Date().toISOString()
    checkpoint.reason = 'Approval timeout after 5 minutes'

    // Emit receipt for timeout
    await ReceiptWriter.writeReceipt({
      sessionId: checkpoint.sessionId,
      type: 'approval.timeout',
      details: {
        checkpoint_id: checkpointId,
        approval_type: checkpoint.type,
        timeout_minutes: 5
      }
    })
  }

  private generateCheckpointId(): string {
    return `checkpoint_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}

// Export singleton instance
export const checkpointManager = new CheckpointManager()
