// packages/war-room/src/types.ts

export type Severity = 'green' | 'yellow' | 'red' | 'critical'

export interface OpsEvent {
  id: string
  source: 'truthserum' | 'execution' | 'silent' | 'sight' | 'robby' | 'ci'
  severity: Severity
  timestamp: string
  message: string
  related_receipts: string[]
  metadata: Record<string, any>
}

export interface HealthStatus {
  overall: Severity
  constitutional: {
    status: Severity
    receipts_per_hour: number
    unverified_attempts: number
    drift_score: number
  }
  engines: EngineHealth[]
  robby: RobbyHealth
  cost: CostHealth
  timestamp: string
}

export interface EngineHealth {
  engine: string
  status: Severity
  last_successful_action: string
  error_rate: number
  fallback_rate: number
  degraded: boolean
  reason?: string
}

export interface RobbyHealth {
  status: Severity
  autonomy_level: number
  blocked_actions_24h: number
  human_interrupts_24h: number
  confidence_delta: number
  in_scope: boolean
}

export interface CostHealth {
  status: Severity
  current_spend_rate: number
  projected_monthly: number
  budget_remaining: number
  kill_threshold: number
  at_risk: boolean
}

export interface RegressionResult {
  timestamp: string
  profile: string
  duration_ms: number
  passed: boolean
  diffs: Diff[]
  golden_bundle_id: string
  receipt_id: string
}

export interface Diff {
  path: string
  type: 'added' | 'removed' | 'changed'
  before: any
  after: any
  severity: Severity
}

export interface ChangeImpact {
  commit_sha: string
  timestamp: string
  affected_engines: string[]
  downstream_effects: Effect[]
  severity: Severity
}

export interface Effect {
  engine: string
  metric: string
  delta: string
  severity: Severity
}

export interface FreezeState {
  frozen: boolean
  reason: string
  frozen_at: string
  frozen_by: string
  receipt_id: string
}
