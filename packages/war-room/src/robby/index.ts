// packages/war-room/src/robby/index.ts
import { RobbyHealth, Severity } from '../types'
import { ReceiptWriter } from '@qbos/truthserum'
import { dataSources } from '../datasources'

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4

export interface AutonomyDowngradeReason {
  from: AutonomyLevel
  to: AutonomyLevel
  reason: string
  timestamp: string
}

export class RobbyMonitor {
  private currentAutonomyLevel: AutonomyLevel = 2

  async getHealth(): Promise<RobbyHealth> {
    const blocked = await this.getBlockedActions(24)
    const interrupts = await this.getHumanInterrupts(24)
    const confidenceDelta = await this.getConfidenceDelta()

    let status: Severity = 'green'
    if (blocked > 50) status = 'red'
    else if (blocked > 10) status = 'yellow'

    return {
      status,
      autonomy_level: this.currentAutonomyLevel,
      blocked_actions_24h: blocked,
      human_interrupts_24h: interrupts,
      confidence_delta: confidenceDelta,
      in_scope: blocked < 50
    }
  }

  async downgrade(to: AutonomyLevel, reason: string): Promise<void> {
    const from = this.currentAutonomyLevel

    if (to >= from) {
      throw new Error(`Cannot downgrade from ${from} to ${to}`)
    }

    this.currentAutonomyLevel = to

    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'robby.autonomy.downgraded',
      details: {
        from,
        to,
        reason,
        timestamp: new Date().toISOString()
      }
    })
  }

  async upgrade(to: AutonomyLevel, reason: string): Promise<void> {
    const from = this.currentAutonomyLevel

    if (to <= from) {
      throw new Error(`Cannot upgrade from ${from} to ${to}`)
    }

    this.currentAutonomyLevel = to

    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'robby.autonomy.upgraded',
      details: {
        from,
        to,
        reason,
        timestamp: new Date().toISOString()
      }
    })
  }

  getAutonomyLevel(): AutonomyLevel {
    return this.currentAutonomyLevel
  }

  async kill(reason: string): Promise<void> {
    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'robby.killed',
      details: {
        reason,
        autonomy_level_at_kill: this.currentAutonomyLevel,
        timestamp: new Date().toISOString()
      }
    })

    // Set autonomy to 0 (manual only)
    this.currentAutonomyLevel = 0
  }

  async checkScope(): Promise<{ in_scope: boolean, violations: string[] }> {
    const blocked = await this.getBlockedActions(24)
    const violations: string[] = []

    if (blocked > 50) {
      violations.push(`Blocked actions exceeded threshold: ${blocked} > 50`)
    }

    return {
      in_scope: violations.length === 0,
      violations
    }
  }

  private async getBlockedActions(hours: number): Promise<number> {
    return dataSources.getRobbyBlockedActions(hours)
  }

  private async getHumanInterrupts(hours: number): Promise<number> {
    return dataSources.getRobbyInterrupts(hours)
  }

  private async getConfidenceDelta(): Promise<number> {
    return dataSources.getRobbyConfidenceDelta()
  }
}
