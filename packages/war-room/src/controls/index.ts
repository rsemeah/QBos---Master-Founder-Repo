// packages/war-room/src/controls/index.ts
import { FreezeState } from '../types'
import { ReceiptWriter } from '@qbos/truthserum'

export class EmergencyControls {
  private freezeState: FreezeState | null = null

  async freeze(reason: string, frozenBy: string): Promise<FreezeState> {
    const receipt = await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'system.frozen',
      details: {
        reason,
        frozen_by: frozenBy,
        timestamp: new Date().toISOString()
      }
    })

    this.freezeState = {
      frozen: true,
      reason,
      frozen_at: new Date().toISOString(),
      frozen_by: frozenBy,
      receipt_id: receipt.id
    }

    return this.freezeState
  }

  async unfreeze(unfrozenBy: string): Promise<void> {
    if (!this.freezeState) {
      throw new Error('System is not frozen')
    }

    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'system.unfrozen',
      details: {
        unfrozen_by: unfrozenBy,
        was_frozen_at: this.freezeState.frozen_at,
        was_frozen_by: this.freezeState.frozen_by,
        duration_seconds: this.getFreezeSeconds(),
        timestamp: new Date().toISOString()
      }
    })

    this.freezeState = null
  }

  getFreezeState(): FreezeState | null {
    return this.freezeState
  }

  isFrozen(): boolean {
    return this.freezeState !== null && this.freezeState.frozen
  }

  private getFreezeSeconds(): number {
    if (!this.freezeState) return 0

    const frozenAt = new Date(this.freezeState.frozen_at)
    const now = new Date()
    return Math.floor((now.getTime() - frozenAt.getTime()) / 1000)
  }

  async emergencyStop(reason: string, stoppedBy: string): Promise<void> {
    // First freeze the system
    await this.freeze(`EMERGENCY STOP: ${reason}`, stoppedBy)

    // Then emit critical alert
    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'emergency.stop.activated',
      details: {
        reason,
        stopped_by: stoppedBy,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      }
    })
  }
}
