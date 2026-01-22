// packages/war-room/src/cost/index.ts
import { CostHealth, Severity } from '../types'
import { ReceiptWriter } from '@qbos/truthserum'

export interface CostCap {
  monthly_budget: number
  kill_threshold: number
  warning_threshold: number
}

export interface RoutingOverride {
  enabled: boolean
  force_model?: string
  reason: string
  expires_at?: string
}

export class CostMonitor {
  private cap: CostCap = {
    monthly_budget: 1000,
    kill_threshold: 1100,
    warning_threshold: 800
  }

  private routingOverride: RoutingOverride = {
    enabled: false,
    reason: ''
  }

  async getHealth(): Promise<CostHealth> {
    const currentRate = await this.getCurrentSpendRate()
    const projected = currentRate * 30 * 24 // Project to monthly
    const remaining = this.cap.monthly_budget - projected

    let status: Severity = 'green'
    if (projected >= this.cap.kill_threshold) status = 'critical'
    else if (remaining < 0) status = 'critical'
    else if (remaining < this.cap.monthly_budget * 0.2) status = 'red'
    else if (remaining < this.cap.monthly_budget * 0.4) status = 'yellow'

    return {
      status,
      current_spend_rate: currentRate,
      projected_monthly: projected,
      budget_remaining: remaining,
      kill_threshold: this.cap.kill_threshold,
      at_risk: status === 'red' || status === 'critical'
    }
  }

  async setCap(cap: Partial<CostCap>): Promise<void> {
    this.cap = { ...this.cap, ...cap }

    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'cost.cap.updated',
      details: this.cap
    })
  }

  async setRoutingOverride(override: RoutingOverride): Promise<void> {
    this.routingOverride = override

    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'cost.routing.overridden',
      details: override
    })
  }

  async clearRoutingOverride(): Promise<void> {
    this.routingOverride = {
      enabled: false,
      reason: 'Cleared by operator'
    }

    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'cost.routing.cleared',
      details: {}
    })
  }

  getRoutingOverride(): RoutingOverride {
    // Check if expired
    if (this.routingOverride.expires_at) {
      const expiresAt = new Date(this.routingOverride.expires_at)
      if (expiresAt < new Date()) {
        this.routingOverride.enabled = false
      }
    }

    return this.routingOverride
  }

  async checkThresholds(): Promise<{ action: 'none' | 'warn' | 'kill', health: CostHealth }> {
    const health = await this.getHealth()

    if (health.projected_monthly >= this.cap.kill_threshold) {
      await ReceiptWriter.write({
        sessionId: 'war-room',
        type: 'cost.kill_threshold.exceeded',
        details: health
      })
      return { action: 'kill', health }
    }

    if (health.budget_remaining < this.cap.warning_threshold) {
      await ReceiptWriter.write({
        sessionId: 'war-room',
        type: 'cost.warning_threshold.exceeded',
        details: health
      })
      return { action: 'warn', health }
    }

    return { action: 'none', health }
  }

  private async getCurrentSpendRate(): Promise<number> {
    // TODO: Query actual spend from SilentEngine metrics
    // For now, return mock value
    return 0.5 // $0.50/hour
  }
}
