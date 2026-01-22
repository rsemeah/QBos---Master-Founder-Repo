// packages/war-room/src/health/index.ts
import { HealthStatus, Severity, EngineHealth, RobbyHealth, CostHealth } from '../types'
import { ReceiptWriter } from '@qbos/truthserum'

export class HealthMonitor {
  async getStatus(): Promise<HealthStatus> {
    const constitutional = await this.checkConstitutional()
    const engines = await this.checkEngines()
    const robby = await this.checkRobby()
    const cost = await this.checkCost()

    const overall = this.computeOverall([
      constitutional.status,
      ...engines.map(e => e.status),
      robby.status,
      cost.status
    ])

    const status: HealthStatus = {
      overall,
      constitutional,
      engines,
      robby,
      cost,
      timestamp: new Date().toISOString()
    }

    // Emit health receipt
    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'health.check.completed',
      details: status
    })

    return status
  }

  private async checkConstitutional() {
    // Check TruthSerum metrics
    const receipts = await this.getRecentReceipts(24) // last 24h
    const unverifiedAttempts = await this.getUnverifiedAttempts(24)

    const receiptsPerHour = receipts.length / 24
    const driftScore = this.calculateDrift(receipts)

    let status: Severity = 'green'
    if (driftScore > 0.5) status = 'red'
    else if (driftScore > 0.2) status = 'yellow'

    return {
      status,
      receipts_per_hour: receiptsPerHour,
      unverified_attempts: unverifiedAttempts,
      drift_score: driftScore
    }
  }

  private async checkEngines(): Promise<EngineHealth[]> {
    const engines = [
      'ExecutionEngine',
      'IdentityEngine',
      'CharterEngine',
      'ConfigEngine',
      'PaywallEngine',
      'NotificationsEngine',
      'SightEngine',
      'SilentEngine'
    ]

    return Promise.all(engines.map(async engine => {
      const metrics = await this.getEngineMetrics(engine)

      let status: Severity = 'green'
      if (metrics.error_rate > 0.1) status = 'red'
      else if (metrics.error_rate > 0.05) status = 'yellow'

      return {
        engine,
        status,
        last_successful_action: metrics.last_success,
        error_rate: metrics.error_rate,
        fallback_rate: metrics.fallback_rate,
        degraded: status !== 'green',
        reason: status !== 'green' ? 'High error rate' : undefined
      }
    }))
  }

  private async checkRobby(): Promise<RobbyHealth> {
    // Check Robby PA metrics
    const blocked = await this.getRobbyBlockedActions(24)
    const interrupts = await this.getRobbyInterrupts(24)
    const autonomyLevel = await this.getRobbyAutonomyLevel()

    let status: Severity = 'green'
    if (blocked > 10) status = 'yellow'
    if (blocked > 50) status = 'red'

    return {
      status,
      autonomy_level: autonomyLevel,
      blocked_actions_24h: blocked,
      human_interrupts_24h: interrupts,
      confidence_delta: 0, // Placeholder
      in_scope: blocked < 50
    }
  }

  private async checkCost(): Promise<CostHealth> {
    // Check SilentEngine cost metrics
    const currentRate = await this.getCurrentSpendRate()
    const projected = currentRate * 30 * 24 // Project to monthly
    const budget = 1000 // TODO: Get from config
    const remaining = budget - projected

    let status: Severity = 'green'
    if (remaining < 0) status = 'critical'
    else if (remaining < budget * 0.2) status = 'red'
    else if (remaining < budget * 0.4) status = 'yellow'

    return {
      status,
      current_spend_rate: currentRate,
      projected_monthly: projected,
      budget_remaining: remaining,
      kill_threshold: budget * 1.1,
      at_risk: status === 'red' || status === 'critical'
    }
  }

  private computeOverall(statuses: Severity[]): Severity {
    if (statuses.includes('critical')) return 'critical'
    if (statuses.includes('red')) return 'red'
    if (statuses.includes('yellow')) return 'yellow'
    return 'green'
  }

  // Placeholder methods - implement with actual data sources
  private async getRecentReceipts(hours: number): Promise<any[]> { return [] }
  private async getUnverifiedAttempts(hours: number): Promise<number> { return 0 }
  private calculateDrift(receipts: any[]): number { return 0 }
  private async getEngineMetrics(engine: string): Promise<any> {
    return { last_success: new Date().toISOString(), error_rate: 0, fallback_rate: 0 }
  }
  private async getRobbyBlockedActions(hours: number): Promise<number> { return 0 }
  private async getRobbyInterrupts(hours: number): Promise<number> { return 0 }
  private async getRobbyAutonomyLevel(): Promise<number> { return 2 }
  private async getCurrentSpendRate(): Promise<number> { return 0.5 }
}
