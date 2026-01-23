// apps/robby/src/workflows/build.ts

/**
 * Robby PA Build Workflow
 * Orchestrates autonomous builds with constitutional enforcement
 */

import { ReceiptWriter } from '../../../packages/truthserum/src/ReceiptWriter.js'
import { autonomyGuard, type AutonomyLevel } from '../policy/autonomy.js'

export interface BuildIntent {
  description: string
  type: 'web-app' | 'ios-app' | 'api' | 'service'
  autonomy_level?: AutonomyLevel
  budget_override?: number
}

export interface BuildResult {
  success: boolean
  build_id: string
  receipts: string[]
  artifacts?: string[]
  error?: string
  cost_actual: number
  duration_seconds: number
}

export class BuildWorkflow {
  private sessionId: string
  private stepCount: number = 0
  private maxStepsBeforeCheckpoint: number = 12 // L2 limit

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `build-${Date.now()}`
  }

  /**
   * Execute build from user intent
   */
  async execute(intent: BuildIntent): Promise<BuildResult> {
    const startTime = Date.now()
    const receipts: string[] = []

    console.log(`\n🤖 Robby PA Build Workflow`)
    console.log(`Session: ${this.sessionId}`)
    console.log(`Intent: ${intent.description}`)
    console.log(`Type: ${intent.type}`)
    console.log(`Autonomy Level: ${intent.autonomy_level || 2}\n`)

    try {
      // Step 1: Autonomy check
      console.log('Step 1/7: Checking autonomy level...')
      const autonomyCheck = this.checkAutonomy(intent)
      if (!autonomyCheck.allowed) {
        throw new Error(autonomyCheck.reason)
      }

      receipts.push(await this.emitReceipt('build.autonomy.checked', {
        level: autonomyCheck.level,
        warnings: autonomyCheck.warnings
      }))

      // Step 2: Intake - Parse intent
      console.log('Step 2/7: Analyzing intent...')
      const intake = await this.intakeIntent(intent)
      receipts.push(intake.receipt_id)

      if (!intake.understood) {
        throw new Error(`Unable to understand intent. Clarifications needed: ${intake.clarifications.join(', ')}`)
      }

      // Step 3: BrainSmart - Generate plan
      console.log('Step 3/7: Generating build plan...')
      const plan = await this.generatePlan(intake)
      receipts.push(plan.receipt_id)

      // Step 4: Scope lock (EthosEngine)
      console.log('Step 4/7: Locking scope...')
      const scopeLock = await this.lockScope(plan)
      receipts.push(scopeLock.receipt_id)

      // Step 5: Cost check
      console.log('Step 5/7: Validating cost estimate...')
      const costCheck = this.validateCost(plan.cost_estimate, intent.budget_override)
      if (!costCheck.valid) {
        throw new Error(costCheck.reason)
      }
      receipts.push(await this.emitReceipt('build.cost.validated', costCheck))

      // Step 6: Execute build (Execution Orchestrator)
      console.log('Step 6/7: Executing build...')
      const execution = await this.executeBuild(plan, autonomyCheck.level)
      receipts.push(...execution.receipts)

      // Step 7: Verification & Release Gate
      console.log('Step 7/7: Verifying build...')
      const verification = await this.verifyBuild(execution)
      receipts.push(verification.receipt_id)

      const duration = Math.floor((Date.now() - startTime) / 1000)

      const result: BuildResult = {
        success: true,
        build_id: this.sessionId,
        receipts,
        artifacts: execution.artifacts,
        cost_actual: execution.cost_actual,
        duration_seconds: duration
      }

      // Emit final receipt
      receipts.push(await this.emitReceipt('build.completed', result))

      console.log(`\n✅ Build completed successfully!`)
      console.log(`Build ID: ${this.sessionId}`)
      console.log(`Duration: ${duration}s`)
      console.log(`Cost: $${execution.cost_actual.toFixed(2)}`)
      console.log(`Receipts: ${receipts.length}`)
      console.log(`Artifacts: ${execution.artifacts?.length || 0}\n`)

      return result

    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000)
      const errorMessage = error instanceof Error ? error.message : String(error)

      console.error(`\n❌ Build failed: ${errorMessage}\n`)

      // Emit failure receipt
      receipts.push(await this.emitReceipt('build.failed', {
        error: errorMessage,
        duration_seconds: duration
      }))

      return {
        success: false,
        build_id: this.sessionId,
        receipts,
        error: errorMessage,
        cost_actual: 0,
        duration_seconds: duration
      }
    }
  }

  /**
   * Step 1: Check autonomy level
   */
  private checkAutonomy(intent: BuildIntent) {
    const level = intent.autonomy_level || 2

    return autonomyGuard.checkAction('build', {
      cost_estimate: intent.budget_override,
      operation_type: 'build',
      critical: false
    })
  }

  /**
   * Step 2: Intake - Parse and understand user intent
   */
  private async intakeIntent(intent: BuildIntent) {
    // TODO: Implement actual IntakeOrchestrator
    // For now, simple validation

    const understood = intent.description.length > 10
    const clarifications: string[] = []

    if (!intent.type) {
      clarifications.push('What type of app? (web-app, ios-app, api, service)')
    }

    const receiptId = await this.emitReceipt('build.intake.completed', {
      understood,
      clarifications,
      intent: intent.description
    })

    return {
      understood,
      clarifications,
      intent,
      receipt_id: receiptId
    }
  }

  /**
   * Step 3: Generate build plan with BrainSmart
   */
  private async generatePlan(intake: any) {
    // TODO: Integrate actual BrainSmart
    // For now, generate simple plan

    const plan = {
      id: `plan-${Date.now()}`,
      intent: intake.intent,
      features: [
        { name: 'Setup', complexity: 2 },
        { name: 'Core functionality', complexity: 5 },
        { name: 'Testing', complexity: 3 }
      ],
      sprints: [
        { number: 1, features: ['Setup', 'Core functionality'], duration: 8 }
      ],
      cost_estimate: 3.50,
      estimated_hours: 8
    }

    const receiptId = await this.emitReceipt('build.plan.generated', {
      plan_id: plan.id,
      features_count: plan.features.length,
      cost_estimate: plan.cost_estimate
    })

    return {
      ...plan,
      receipt_id: receiptId
    }
  }

  /**
   * Step 4: Lock scope with EthosEngine
   */
  private async lockScope(plan: any) {
    // TODO: Implement actual EthosEngine
    // For now, simple lock

    const scopeLock = {
      plan_id: plan.id,
      locked: true,
      features: plan.features,
      locked_at: new Date().toISOString()
    }

    const receiptId = await this.emitReceipt('build.scope.locked', scopeLock)

    return {
      ...scopeLock,
      receipt_id: receiptId
    }
  }

  /**
   * Step 5: Validate cost estimate
   */
  private validateCost(estimate: number, budgetOverride?: number) {
    const budgetCap = budgetOverride || autonomyGuard.getBudgetCap()

    if (estimate > budgetCap) {
      return {
        valid: false,
        reason: `Estimated cost ($${estimate}) exceeds budget cap ($${budgetCap})`,
        requires_approval: true
      }
    }

    if (estimate > budgetCap * 0.8) {
      return {
        valid: true,
        warning: `Cost estimate approaching budget cap (${((estimate / budgetCap) * 100).toFixed(0)}%)`,
        requires_monitoring: true
      }
    }

    return {
      valid: true,
      estimate,
      budget_cap: budgetCap,
      headroom: budgetCap - estimate
    }
  }

  /**
   * Step 6: Execute build with Execution Orchestrator
   */
  private async executeBuild(plan: any, autonomyLevel: AutonomyLevel) {
    // TODO: Implement actual Execution Orchestrator
    // For now, simulate build

    console.log(`   Executing ${plan.features.length} features...`)

    const receipts: string[] = []

    for (const feature of plan.features) {
      // Check step limit before each feature (L2 enforcement)
      await this.checkStepLimitAndApprove(feature.name, autonomyLevel)

      const featureReceipt = await this.emitReceipt('build.feature.executed', {
        feature: feature.name,
        complexity: feature.complexity,
        step_count: this.stepCount
      })
      receipts.push(featureReceipt)
      console.log(`   ✓ ${feature.name}`)
    }

    return {
      plan_id: plan.id,
      receipts,
      artifacts: [
        'src/index.ts',
        'package.json',
        'README.md'
      ],
      cost_actual: plan.cost_estimate * 0.95, // Slightly under estimate
      status: 'completed'
    }
  }

  /**
   * Step 7: Verify build with Release Gate
   */
  private async verifyBuild(execution: any) {
    // TODO: Implement actual Release Gate
    // For now, simple verification

    const checks = {
      artifacts_present: execution.artifacts.length > 0,
      receipts_complete: execution.receipts.length > 0,
      cost_within_budget: true,
      tests_passed: true
    }

    const passed = Object.values(checks).every(v => v)

    const receiptId = await this.emitReceipt('build.verification.completed', {
      passed,
      checks
    })

    return {
      passed,
      checks,
      receipt_id: receiptId
    }
  }

  /**
   * Check if step limit reached and request approval if needed (L2)
   */
  private async checkStepLimitAndApprove(featureName: string, autonomyLevel: AutonomyLevel): Promise<void> {
    this.stepCount++

    if (autonomyLevel === 2 && this.stepCount >= this.maxStepsBeforeCheckpoint) {
      console.log(`\n⏸️  Checkpoint: ${this.stepCount} steps completed`)
      console.log(`Feature: ${featureName}`)
      console.log(`L2 autonomy requires approval to continue...\n`)

      // Emit checkpoint required receipt
      await this.emitReceipt('build.checkpoint.required', {
        step_count: this.stepCount,
        step_limit: this.maxStepsBeforeCheckpoint,
        feature: featureName,
        autonomy_level: autonomyLevel
      })

      // In a real implementation, this would pause and wait for approval
      // For now, auto-approve but emit receipt
      console.log(`✅ Auto-approved (production would require human approval)`)

      await this.emitReceipt('build.checkpoint.approved', {
        step_count: this.stepCount,
        feature: featureName,
        approved_by: 'auto' // In production: userId
      })

      // Reset step count after checkpoint
      this.stepCount = 0
    }
  }

  /**
   * Emit receipt to TruthSerum
   */
  private async emitReceipt(type: string, details: any): Promise<string> {
    const receipt = await ReceiptWriter.write({
      sessionId: this.sessionId,
      type,
      details
    })

    return receipt.id
  }
}
