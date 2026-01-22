// packages/war-room/src/drift/index.ts
import { Severity } from '../types'
import { ReceiptWriter } from '@qbos/truthserum'
import { dataSources } from '../datasources'

export interface DriftAlert {
  timestamp: string
  metric: string
  baseline: number
  current: number
  drift_percentage: number
  severity: Severity
  description: string
}

export interface DriftConfig {
  yellow_threshold: number  // e.g., 0.15 = 15% drift
  red_threshold: number      // e.g., 0.30 = 30% drift
  critical_threshold: number // e.g., 0.50 = 50% drift
  baseline_window_hours: number
  comparison_window_hours: number
}

export class DriftDetector {
  private config: DriftConfig = {
    yellow_threshold: 0.15,
    red_threshold: 0.30,
    critical_threshold: 0.50,
    baseline_window_hours: 168, // 1 week
    comparison_window_hours: 24  // Last 24 hours
  }

  /**
   * Detect drift across all monitored metrics
   */
  async detectDrift(): Promise<DriftAlert[]> {
    const alerts: DriftAlert[] = []

    // Get baseline and current data
    const baseline = await this.getBaselineMetrics()
    const current = await this.getCurrentMetrics()

    // Check receipt volume drift
    const receiptDrift = this.calculateDrift(
      baseline.receipt_volume,
      current.receipt_volume
    )

    if (receiptDrift.severity !== 'green') {
      alerts.push({
        timestamp: new Date().toISOString(),
        metric: 'receipt_volume',
        baseline: baseline.receipt_volume,
        current: current.receipt_volume,
        drift_percentage: receiptDrift.percentage,
        severity: receiptDrift.severity,
        description: `Receipt volume ${receiptDrift.percentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(receiptDrift.percentage).toFixed(1)}%`
      })
    }

    // Check error rate drift
    const errorDrift = this.calculateDrift(
      baseline.error_rate,
      current.error_rate
    )

    if (errorDrift.severity !== 'green') {
      alerts.push({
        timestamp: new Date().toISOString(),
        metric: 'error_rate',
        baseline: baseline.error_rate,
        current: current.error_rate,
        drift_percentage: errorDrift.percentage,
        severity: errorDrift.severity,
        description: `Error rate ${errorDrift.percentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(errorDrift.percentage).toFixed(1)}%`
      })
    }

    // Check cost drift
    const costDrift = this.calculateDrift(
      baseline.cost_per_hour,
      current.cost_per_hour
    )

    if (costDrift.severity !== 'green') {
      alerts.push({
        timestamp: new Date().toISOString(),
        metric: 'cost_per_hour',
        baseline: baseline.cost_per_hour,
        current: current.cost_per_hour,
        drift_percentage: costDrift.percentage,
        severity: costDrift.severity,
        description: `Cost per hour ${costDrift.percentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(costDrift.percentage).toFixed(1)}%`
      })
    }

    // Check behavioral drift (type distribution)
    const behaviorDrift = await this.detectBehavioralDrift()
    if (behaviorDrift) {
      alerts.push(behaviorDrift)
    }

    // Emit drift alerts receipt
    if (alerts.length > 0) {
      await ReceiptWriter.write({
        sessionId: 'war-room',
        type: 'drift.alerts.detected',
        details: {
          alert_count: alerts.length,
          max_severity: this.getMaxSeverity(alerts),
          alerts
        }
      })
    }

    return alerts
  }

  /**
   * Monitor for continuous drift and emit alerts
   */
  async monitorContinuous(intervalMinutes: number = 60): Promise<void> {
    setInterval(async () => {
      try {
        const alerts = await this.detectDrift()

        if (alerts.length > 0) {
          console.log(`⚠️  Drift detected: ${alerts.length} alerts`)
          alerts.forEach(alert => {
            console.log(`   ${alert.severity.toUpperCase()}: ${alert.description}`)
          })
        }
      } catch (error) {
        console.error('Drift detection failed:', error)
      }
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Get drift report for a specific time range
   */
  async getDriftReport(hours: number = 24): Promise<{
    summary: string
    alerts: DriftAlert[]
    recommendation: string
  }> {
    const alerts = await this.detectDrift()

    const maxSeverity = this.getMaxSeverity(alerts)

    let summary = 'No significant drift detected'
    let recommendation = 'System behavior is stable'

    if (alerts.length > 0) {
      summary = `${alerts.length} drift alert(s) detected`

      if (maxSeverity === 'critical') {
        recommendation = 'IMMEDIATE ACTION REQUIRED: Critical drift detected. Consider freeze and investigation.'
      } else if (maxSeverity === 'red') {
        recommendation = 'High drift detected. Review recent changes and run regression tests.'
      } else if (maxSeverity === 'yellow') {
        recommendation = 'Moderate drift detected. Monitor closely and investigate if it persists.'
      }
    }

    return {
      summary,
      alerts,
      recommendation
    }
  }

  private async getBaselineMetrics(): Promise<{
    receipt_volume: number
    error_rate: number
    cost_per_hour: number
  }> {
    const receipts = await dataSources.getRecentReceipts(this.config.baseline_window_hours)

    const errors = receipts.filter(r =>
      r.type.includes('error') || r.type.includes('failed')
    )

    // Average per hour
    const receiptVolume = receipts.length / this.config.baseline_window_hours
    const errorRate = receipts.length > 0 ? errors.length / receipts.length : 0

    // Get cost data
    const costPerHour = await dataSources.getCurrentSpendRate()

    return {
      receipt_volume: receiptVolume,
      error_rate: errorRate,
      cost_per_hour: costPerHour
    }
  }

  private async getCurrentMetrics(): Promise<{
    receipt_volume: number
    error_rate: number
    cost_per_hour: number
  }> {
    const receipts = await dataSources.getRecentReceipts(this.config.comparison_window_hours)

    const errors = receipts.filter(r =>
      r.type.includes('error') || r.type.includes('failed')
    )

    const receiptVolume = receipts.length / this.config.comparison_window_hours
    const errorRate = receipts.length > 0 ? errors.length / receipts.length : 0
    const costPerHour = await dataSources.getCurrentSpendRate()

    return {
      receipt_volume: receiptVolume,
      error_rate: errorRate,
      cost_per_hour: costPerHour
    }
  }

  private calculateDrift(baseline: number, current: number): {
    percentage: number
    severity: Severity
  } {
    if (baseline === 0) {
      return { percentage: 0, severity: 'green' }
    }

    const driftPercentage = ((current - baseline) / baseline) * 100
    const absDrift = Math.abs(driftPercentage) / 100

    let severity: Severity = 'green'
    if (absDrift >= this.config.critical_threshold) severity = 'critical'
    else if (absDrift >= this.config.red_threshold) severity = 'red'
    else if (absDrift >= this.config.yellow_threshold) severity = 'yellow'

    return { percentage: driftPercentage, severity }
  }

  private async detectBehavioralDrift(): Promise<DriftAlert | null> {
    const baseline = await dataSources.getRecentReceipts(this.config.baseline_window_hours)
    const current = await dataSources.getRecentReceipts(this.config.comparison_window_hours)

    const baselineTypes = this.getTypeDistribution(baseline)
    const currentTypes = this.getTypeDistribution(current)

    // Calculate Kullback-Leibler divergence or similar metric
    const divergence = this.calculateDistributionDivergence(baselineTypes, currentTypes)

    const drift = this.calculateDrift(0.1, divergence) // Baseline divergence ~0.1

    if (drift.severity !== 'green') {
      return {
        timestamp: new Date().toISOString(),
        metric: 'behavioral_pattern',
        baseline: 0.1,
        current: divergence,
        drift_percentage: drift.percentage,
        severity: drift.severity,
        description: `Behavioral pattern has shifted by ${drift.percentage.toFixed(1)}%`
      }
    }

    return null
  }

  private getTypeDistribution(receipts: any[]): Record<string, number> {
    const distribution: Record<string, number> = {}

    receipts.forEach(r => {
      distribution[r.type] = (distribution[r.type] || 0) + 1
    })

    // Normalize
    const total = receipts.length
    Object.keys(distribution).forEach(key => {
      distribution[key] = distribution[key] / total
    })

    return distribution
  }

  private calculateDistributionDivergence(
    baseline: Record<string, number>,
    current: Record<string, number>
  ): number {
    // Simple symmetric divergence metric
    const allTypes = new Set([...Object.keys(baseline), ...Object.keys(current)])

    let divergence = 0
    allTypes.forEach(type => {
      const p = baseline[type] || 0.001
      const q = current[type] || 0.001
      divergence += Math.abs(p - q)
    })

    return divergence / 2 // Normalize
  }

  private getMaxSeverity(alerts: DriftAlert[]): Severity {
    if (alerts.some(a => a.severity === 'critical')) return 'critical'
    if (alerts.some(a => a.severity === 'red')) return 'red'
    if (alerts.some(a => a.severity === 'yellow')) return 'yellow'
    return 'green'
  }
}
