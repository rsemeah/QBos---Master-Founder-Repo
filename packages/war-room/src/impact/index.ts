// packages/war-room/src/impact/index.ts
import { ChangeImpact, Effect, Severity } from '../types'
import { ReceiptWriter } from '@qbos/truthserum'
import { dataSources } from '../datasources'

export class ImpactAnalyzer {
  /**
   * Analyze the impact of a specific commit on system health
   */
  async analyzeCommit(commitSha: string): Promise<ChangeImpact> {
    const timestamp = new Date().toISOString()

    // Get receipts before and after commit
    const beforeReceipts = await this.getReceiptsBeforeCommit(commitSha)
    const afterReceipts = await this.getReceiptsAfterCommit(commitSha)

    // Identify affected engines
    const affectedEngines = this.identifyAffectedEngines(beforeReceipts, afterReceipts)

    // Calculate downstream effects
    const downstreamEffects = await this.calculateDownstreamEffects(
      affectedEngines,
      beforeReceipts,
      afterReceipts
    )

    // Determine overall severity
    const severity = this.calculateOverallSeverity(downstreamEffects)

    const impact: ChangeImpact = {
      commit_sha: commitSha,
      timestamp,
      affected_engines: affectedEngines,
      downstream_effects: downstreamEffects,
      severity
    }

    // Emit receipt
    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'impact.analysis.completed',
      details: impact
    })

    return impact
  }

  /**
   * Continuously monitor for impact of recent changes
   */
  async monitorRecentChanges(hours: number = 24): Promise<ChangeImpact[]> {
    // Get recent commits from git
    const commits = await this.getRecentCommits(hours)

    const impacts: ChangeImpact[] = []

    for (const commit of commits) {
      try {
        const impact = await this.analyzeCommit(commit.sha)
        impacts.push(impact)
      } catch (error) {
        console.warn(`Failed to analyze commit ${commit.sha}:`, error)
      }
    }

    return impacts
  }

  /**
   * Correlate health degradation with specific commits
   */
  async correlateDegradation(since: string): Promise<{
    degradations: any[]
    likely_causes: ChangeImpact[]
  }> {
    const receipts = await dataSources.getRecentReceipts(24)

    // Identify health degradations
    const degradations = receipts.filter(r =>
      r.type.includes('error') ||
      r.type.includes('failed') ||
      r.type.includes('degraded')
    )

    if (degradations.length === 0) {
      return { degradations: [], likely_causes: [] }
    }

    // Get commits around degradation time
    const commits = await this.getRecentCommits(24)
    const impacts = await Promise.all(
      commits.map(c => this.analyzeCommit(c.sha))
    )

    // Filter to high-severity impacts
    const likelyCauses = impacts.filter(i =>
      i.severity === 'red' || i.severity === 'critical'
    )

    return {
      degradations,
      likely_causes: likelyCauses
    }
  }

  private async getReceiptsBeforeCommit(commitSha: string): Promise<any[]> {
    // Query receipts from 1 hour before commit
    // In production, use git commit timestamp
    const before = new Date(Date.now() - 2 * 60 * 60 * 1000)
    return dataSources.getRecentReceipts(2) || []
  }

  private async getReceiptsAfterCommit(commitSha: string): Promise<any[]> {
    // Query receipts from 1 hour after commit
    const after = new Date(Date.now() - 1 * 60 * 60 * 1000)
    return dataSources.getRecentReceipts(1) || []
  }

  private identifyAffectedEngines(before: any[], after: any[]): string[] {
    const beforeSources = new Set(before.map(r => r.source))
    const afterSources = new Set(after.map(r => r.source))

    // Engines with changed behavior
    const affected = new Set<string>()

    // Engines with increased error rates
    for (const source of afterSources) {
      const beforeErrors = before.filter(r =>
        r.source === source && (r.type.includes('error') || r.type.includes('failed'))
      ).length

      const afterErrors = after.filter(r =>
        r.source === source && (r.type.includes('error') || r.type.includes('failed'))
      ).length

      if (afterErrors > beforeErrors) {
        affected.add(source)
      }
    }

    return Array.from(affected)
  }

  private async calculateDownstreamEffects(
    affectedEngines: string[],
    before: any[],
    after: any[]
  ): Promise<Effect[]> {
    const effects: Effect[] = []

    for (const engine of affectedEngines) {
      const beforeMetrics = await this.calculateMetrics(before, engine)
      const afterMetrics = await this.calculateMetrics(after, engine)

      // Error rate delta
      const errorDelta = afterMetrics.error_rate - beforeMetrics.error_rate
      if (Math.abs(errorDelta) > 0.01) {
        effects.push({
          engine,
          metric: 'error_rate',
          delta: `${(errorDelta * 100).toFixed(2)}%`,
          severity: errorDelta > 0.1 ? 'red' : errorDelta > 0.05 ? 'yellow' : 'green'
        })
      }

      // Throughput delta
      const throughputDelta = afterMetrics.throughput - beforeMetrics.throughput
      if (Math.abs(throughputDelta) > 10) {
        effects.push({
          engine,
          metric: 'throughput',
          delta: `${throughputDelta > 0 ? '+' : ''}${throughputDelta.toFixed(0)} req/hr`,
          severity: throughputDelta < -50 ? 'red' : throughputDelta < -20 ? 'yellow' : 'green'
        })
      }
    }

    return effects
  }

  private async calculateMetrics(receipts: any[], engine: string): Promise<{
    error_rate: number
    throughput: number
  }> {
    const engineReceipts = receipts.filter(r => r.source === engine)

    if (engineReceipts.length === 0) {
      return { error_rate: 0, throughput: 0 }
    }

    const errors = engineReceipts.filter(r =>
      r.type.includes('error') || r.type.includes('failed')
    ).length

    return {
      error_rate: errors / engineReceipts.length,
      throughput: engineReceipts.length
    }
  }

  private calculateOverallSeverity(effects: Effect[]): Severity {
    if (effects.some(e => e.severity === 'critical')) return 'critical'
    if (effects.some(e => e.severity === 'red')) return 'red'
    if (effects.some(e => e.severity === 'yellow')) return 'yellow'
    return 'green'
  }

  private async getRecentCommits(hours: number): Promise<{ sha: string; timestamp: string }[]> {
    // TODO: Integrate with git to get actual commits
    // For now, return mock data
    return [
      { sha: 'abc123', timestamp: new Date().toISOString() }
    ]
  }
}
