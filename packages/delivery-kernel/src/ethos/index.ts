// packages/delivery-kernel/src/ethos/index.ts

/**
 * EthosEngine - Constitutional Enforcement & Hard Scope Lock
 * Ensures all operations comply with CONSTITUTION.md
 */

import { ReceiptWriter } from '@qbos/truthserum'
import type {
  BuildPlan,
  Scope,
  ConstitutionalCheck,
  AutonomyLevel
} from '../types.js'

export class EthosEngine {
  /**
   * Lock scope - no features may be added after this
   */
  async lockScope(plan: BuildPlan, sessionId: string): Promise<Scope> {
    const scope = plan.scope
    scope.locked = true

    // Emit receipt
    await ReceiptWriter.write({
      sessionId,
      type: 'ethos.scope.locked',
      details: {
        plan_id: plan.id,
        features_count: scope.features.length,
        locked_at: new Date().toISOString()
      }
    })

    console.log(`🔒 Scope locked: ${scope.features.length} features`)

    return scope
  }

  /**
   * Validate operation against constitution
   */
  async validateOperation(
    operation: string,
    context: {
      scope_locked?: boolean
      cost_estimate?: number
      autonomy_level?: AutonomyLevel
      budget_remaining?: number
    },
    sessionId: string
  ): Promise<ConstitutionalCheck> {
    const violations: string[] = []
    const recommendations: string[] = []

    // Check scope lock violation
    const scopeValid = this.checkScopeCompliance(operation, context.scope_locked)
    if (!scopeValid) {
      violations.push('Scope lock violation: Cannot add features after scope is locked')
      recommendations.push('Request charter amendment via formal process')
    }

    // Check cost compliance
    const costValid = this.checkCostCompliance(
      context.cost_estimate,
      context.budget_remaining
    )
    if (!costValid) {
      violations.push(`Cost estimate exceeds budget remaining`)
      recommendations.push('Reduce scope or increase budget allocation')
    }

    // Check autonomy compliance
    const autonomyValid = this.checkAutonomyCompliance(
      operation,
      context.autonomy_level
    )
    if (!autonomyValid) {
      violations.push(`Operation '${operation}' not permitted at autonomy level ${context.autonomy_level}`)
      recommendations.push('Upgrade autonomy level or request manual approval')
    }

    const check: ConstitutionalCheck = {
      passed: violations.length === 0,
      violations,
      scope_valid: scopeValid,
      cost_valid: costValid,
      autonomy_valid: autonomyValid,
      recommendations
    }

    // Emit receipt
    await ReceiptWriter.write({
      sessionId,
      type: 'ethos.validation.completed',
      details: {
        operation,
        passed: check.passed,
        violations_count: violations.length
      }
    })

    return check
  }

  /**
   * Check if operation complies with scope lock
   */
  private checkScopeCompliance(operation: string, scopeLocked?: boolean): boolean {
    if (!scopeLocked) return true

    // Operations that violate scope lock
    const scopeViolations = [
      'add-feature',
      'expand-scope',
      'new-requirement'
    ]

    return !scopeViolations.some(v => operation.includes(v))
  }

  /**
   * Check if cost complies with budget
   */
  private checkCostCompliance(costEstimate?: number, budgetRemaining?: number): boolean {
    if (!costEstimate || !budgetRemaining) return true

    return costEstimate <= budgetRemaining
  }

  /**
   * Check if operation complies with autonomy level
   */
  private checkAutonomyCompliance(operation: string, autonomyLevel?: AutonomyLevel): boolean {
    if (autonomyLevel === undefined) return true

    // Critical operations that require higher autonomy
    const criticalOps = {
      'production-deployment': 4,
      'database-migration': 3,
      'payment-integration': 3,
      'auth-changes': 3
    }

    for (const [op, requiredLevel] of Object.entries(criticalOps)) {
      if (operation.includes(op) && autonomyLevel < requiredLevel) {
        return false
      }
    }

    return true
  }

  /**
   * Enforce feature creep prevention
   */
  async preventFeatureCreep(
    proposedFeature: string,
    lockedScope: Scope,
    sessionId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!lockedScope.locked) {
      return { allowed: true }
    }

    // Check if feature already in scope
    const inScope = lockedScope.features.some((f: any) =>
      f.name.toLowerCase().includes(proposedFeature.toLowerCase())
    )

    if (inScope) {
      return { allowed: true }
    }

    // Check if explicitly out of scope
    const outOfScope = lockedScope.out_of_scope.some((oos: string) =>
      oos.toLowerCase().includes(proposedFeature.toLowerCase())
    )

    // Emit rejection receipt
    await ReceiptWriter.write({
      sessionId,
      type: 'ethos.feature_creep.prevented',
      details: {
        proposed_feature: proposedFeature,
        reason: outOfScope ? 'Explicitly out of scope' : 'Not in locked scope'
      }
    })

    return {
      allowed: false,
      reason: outOfScope
        ? `Feature "${proposedFeature}" is explicitly out of scope`
        : `Scope is locked. Feature "${proposedFeature}" not included. Request charter amendment to proceed.`
    }
  }

  /**
   * Generate constitutional report
   */
  async generateComplianceReport(
    plan: BuildPlan,
    sessionId: string
  ): Promise<{
    compliant: boolean
    violations: string[]
    recommendations: string[]
  }> {
    const violations: string[] = []
    const recommendations: string[] = []

    // Check scope lock state
    if (!plan.scope.locked && plan.sprints.length > 0) {
      violations.push('Sprints defined but scope not locked')
      recommendations.push('Lock scope before sprint execution')
    }

    // Check cost estimate exists
    if (!plan.cost_estimate || plan.cost_estimate.estimated_cost === 0) {
      violations.push('No cost estimate provided')
      recommendations.push('Generate cost estimate before proceeding')
    }

    // Check receipt chain
    // TODO: Verify receipt parent-child relationships

    const report = {
      compliant: violations.length === 0,
      violations,
      recommendations
    }

    await ReceiptWriter.write({
      sessionId,
      type: 'ethos.compliance_report.generated',
      details: report
    })

    return report
  }
}
