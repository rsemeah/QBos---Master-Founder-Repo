// apps/robby/src/policy/autonomy.ts

/**
 * Autonomy Policy Enforcement
 * Implements AUTONOMY_POLICY.md + CONSTITUTION.md Article II
 */

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4

export interface AutonomyConfig {
  current_level: AutonomyLevel
  budget_cap: number
  token_cap: number
  step_limit: number
  escalation_enabled: boolean
}

export interface AutonomyCheck {
  allowed: boolean
  level: AutonomyLevel
  reason?: string
  requires_approval?: boolean
  warnings: string[]
}

export class AutonomyGuard {
  private config: AutonomyConfig

  constructor(level: AutonomyLevel = 2) {
    this.config = this.getConfigForLevel(level)
  }

  /**
   * Check if action is allowed at current autonomy level
   */
  checkAction(action: string, context: {
    cost_estimate?: number
    step_count?: number
    operation_type?: string
    critical?: boolean
  }): AutonomyCheck {
    const level = this.config.current_level
    const warnings: string[] = []

    // Level 0: No execution allowed
    if (level === 0) {
      return {
        allowed: false,
        level,
        reason: 'Autonomy Level 0: Manual only. No execution permitted.',
        warnings
      }
    }

    // Level 1: Read-only
    if (level === 1) {
      const readOnlyActions = ['analyze', 'estimate', 'plan', 'report']
      const isReadOnly = readOnlyActions.some(a => action.includes(a))

      if (!isReadOnly) {
        return {
          allowed: false,
          level,
          reason: 'Autonomy Level 1: Read-only. Execution not permitted.',
          warnings
        }
      }
    }

    // Cost checks
    if (context.cost_estimate && context.cost_estimate > this.config.budget_cap) {
      return {
        allowed: false,
        level,
        reason: `Cost estimate ($${context.cost_estimate}) exceeds budget cap ($${this.config.budget_cap})`,
        requires_approval: level >= 2,
        warnings: ['Cost overrun - human approval required']
      }
    }

    // Step count checks
    if (context.step_count && context.step_count > this.config.step_limit) {
      warnings.push(`Step count (${context.step_count}) exceeds limit (${this.config.step_limit}) - checkpoint required`)

      if (level === 2) {
        return {
          allowed: false,
          level,
          reason: 'Too many steps for L2 - requires checkpoint approval',
          requires_approval: true,
          warnings
        }
      }
    }

    // Critical operations always require approval (except L4)
    if (context.critical && level < 4) {
      return {
        allowed: false,
        level,
        reason: 'Critical operation requires human approval',
        requires_approval: true,
        warnings: ['Critical operation flagged']
      }
    }

    // Operation type checks
    if (context.operation_type) {
      const restricted = this.isRestrictedOperation(context.operation_type, level)
      if (restricted) {
        return {
          allowed: false,
          level,
          reason: `Operation '${context.operation_type}' restricted at L${level}`,
          requires_approval: true,
          warnings: ['Restricted operation']
        }
      }
    }

    // All checks passed
    return {
      allowed: true,
      level,
      warnings
    }
  }

  /**
   * Check if operation is restricted at this autonomy level
   */
  private isRestrictedOperation(operation: string, level: AutonomyLevel): boolean {
    const alwaysRestricted = [
      'auth-changes',
      'payment-processing',
      'database-schema-production',
      'sudo',
      'credentials-management'
    ]

    if (alwaysRestricted.includes(operation)) {
      return true
    }

    // L2 restrictions
    if (level === 2) {
      const l2Restricted = [
        'deployment',
        'release',
        'npm-install',
        'dependency-add'
      ]
      if (l2Restricted.includes(operation)) {
        return false // Allow but require approval
      }
    }

    // L3 restrictions
    if (level === 3) {
      const l3Restricted = [
        'production-deployment',
        'release-to-appstore'
      ]
      return l3Restricted.includes(operation)
    }

    return false
  }

  /**
   * Get configuration for autonomy level
   */
  private getConfigForLevel(level: AutonomyLevel): AutonomyConfig {
    switch (level) {
      case 0:
        return {
          current_level: 0,
          budget_cap: 0,
          token_cap: 0,
          step_limit: 0,
          escalation_enabled: true
        }

      case 1:
        return {
          current_level: 1,
          budget_cap: 1,
          token_cap: 4000,
          step_limit: 0, // No execution
          escalation_enabled: true
        }

      case 2: // DEFAULT
        return {
          current_level: 2,
          budget_cap: 5,
          token_cap: 8000,
          step_limit: 12,
          escalation_enabled: true
        }

      case 3:
        return {
          current_level: 3,
          budget_cap: 20,
          token_cap: 8000,
          step_limit: 50,
          escalation_enabled: true
        }

      case 4:
        return {
          current_level: 4,
          budget_cap: 50,
          token_cap: 8000,
          step_limit: Infinity,
          escalation_enabled: true
        }

      default:
        return this.getConfigForLevel(2) // Default to L2
    }
  }

  /**
   * Get current autonomy level
   */
  getLevel(): AutonomyLevel {
    return this.config.current_level
  }

  /**
   * Get budget cap for current level
   */
  getBudgetCap(): number {
    return this.config.budget_cap
  }

  /**
   * Get token cap for current level
   */
  getTokenCap(): number {
    return this.config.token_cap
  }

  /**
   * Check if downgrade is needed based on metrics
   */
  shouldDowngrade(metrics: {
    error_rate?: number
    cost_variance?: number
    failed_builds?: number
    interrupts?: number
  }): { downgrade: boolean; to_level: AutonomyLevel; reason: string } | null {
    const level = this.config.current_level

    // Critical violations -> L0
    if (metrics.error_rate && metrics.error_rate > 0.15) {
      return {
        downgrade: true,
        to_level: 0,
        reason: `Critical error rate: ${(metrics.error_rate * 100).toFixed(1)}% > 15%`
      }
    }

    // High error rate -> L1
    if (metrics.error_rate && metrics.error_rate > 0.10 && level > 1) {
      return {
        downgrade: true,
        to_level: 1,
        reason: `High error rate: ${(metrics.error_rate * 100).toFixed(1)}% > 10%`
      }
    }

    // Failed builds
    if (metrics.failed_builds && metrics.failed_builds >= 3 && level > 1) {
      return {
        downgrade: true,
        to_level: 1,
        reason: `3+ consecutive failed builds (${metrics.failed_builds})`
      }
    }

    // Cost variance
    if (metrics.cost_variance && metrics.cost_variance > 0.5 && level > 2) {
      return {
        downgrade: true,
        to_level: 2,
        reason: `Cost variance ${(metrics.cost_variance * 100).toFixed(0)}% > 50%`
      }
    }

    // Too many interrupts
    if (metrics.interrupts && metrics.interrupts > 10 && level > 1) {
      return {
        downgrade: true,
        to_level: 1,
        reason: `Excessive human interrupts: ${metrics.interrupts} > 10`
      }
    }

    return null
  }
}

/**
 * Singleton autonomy guard (defaults to L2)
 */
export const autonomyGuard = new AutonomyGuard(2)
