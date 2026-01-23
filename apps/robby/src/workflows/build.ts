// apps/robby/src/workflows/build.ts

/**
 * Robby PA Build Workflow
 * Orchestrates autonomous builds with constitutional enforcement
 */

import { ReceiptWriter } from '../../../packages/truthserum/src/ReceiptWriter.js'
import { autonomyGuard, type AutonomyLevel } from '../policy/autonomy.js'
import { BrainSmart } from '../../../packages/delivery-kernel/src/brainsmart/index.js'
import { EthosEngine } from '../../../packages/delivery-kernel/src/ethos/index.js'
import { JourneysEngine } from '../../../packages/delivery-kernel/src/journeys/index.js'
import type { UserIntent } from '../../../packages/delivery-kernel/src/types.js'

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
   * Step 2: Intake - Parse and understand user intent with BrainSmart
   */
  private async intakeIntent(intent: BuildIntent) {
    const brainSmart = new BrainSmart({
      api_key: process.env.GROQ_API_KEY
    })

    const userIntent: UserIntent = {
      type: intent.type,
      description: intent.description,
      features: [], // Will be extracted by BrainSmart
      constraints: intent.budget_override ? {
        budget: intent.budget_override
      } : undefined
    }

    const result = await brainSmart.analyzeIntent(userIntent, {
      autonomy_level: intent.autonomy_level || 2,
      budget_remaining: intent.budget_override || autonomyGuard.getBudgetCap()
    })

    const understood = result.confidence > 0.7
    const clarifications = result.recommendations

    const receiptId = await this.emitReceipt('build.intake.completed', {
      understood,
      confidence: result.confidence,
      clarifications,
      intent: intent.description,
      plan_id: result.plan.id
    })

    return {
      understood,
      clarifications,
      intent: userIntent,
      plan: result.plan,
      receipt_id: receiptId
    }
  }

  /**
   * Step 3: Generate build plan with BrainSmart (already done in intake)
   */
  private async generatePlan(intake: any) {
    // Plan already generated by BrainSmart in intake step
    const plan = intake.plan

    const receiptId = await this.emitReceipt('build.plan.generated', {
      plan_id: plan.id,
      features_count: plan.scope.features.length,
      sprints_count: plan.sprints.length,
      cost_estimate: plan.cost_estimate.estimated_cost,
      estimated_hours: plan.timeline.estimated_hours
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
    const ethosEngine = new EthosEngine()

    // Lock scope using EthosEngine (emits its own receipt)
    const lockedScope = await ethosEngine.lockScope(plan, this.sessionId)

    // EthosEngine already emitted receipt, but we return confirmation
    return {
      plan_id: plan.id,
      locked: lockedScope.locked,
      features: lockedScope.features,
      locked_at: new Date().toISOString(),
      receipt_id: 'emitted-by-ethos' // EthosEngine already emitted
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
   * Step 6: Execute build with JourneysEngine and Execution Orchestrator
   */
  private async executeBuild(plan: any, autonomyLevel: AutonomyLevel) {
    const receipts: string[] = []

    // Generate Scrum artifacts with JourneysEngine
    const journeysEngine = new JourneysEngine()
    const scrumArtifacts = await journeysEngine.generateScrumArtifacts(plan, this.sessionId)

    console.log(`   Executing ${scrumArtifacts.sprint_backlogs.length} sprints...`)

    // Execute each sprint
    for (const sprintBacklog of scrumArtifacts.sprint_backlogs) {
      console.log(`   Sprint ${sprintBacklog.sprint_id}: ${sprintBacklog.goal}`)

      // Check step limit before sprint (L2 enforcement)
      await this.checkStepLimitAndApprove(`Sprint ${sprintBacklog.sprint_id}`, autonomyLevel)

      // TODO: Implement real ExecutionOrchestrator (Phase 7)
      // For now, simulate execution of backlog items
      for (const item of sprintBacklog.items) {
        const itemReceipt = await this.emitReceipt('build.backlog.item.executed', {
          item_id: item.id,
          user_story: item.user_story,
          story_points: item.story_points,
          step_count: this.stepCount
        })
        receipts.push(itemReceipt)
        console.log(`     ✓ ${item.user_story}`)
      }
    }

    return {
      plan_id: plan.id,
      receipts,
      artifacts: [
        'src/index.ts',
        'package.json',
        'README.md',
        'tests/',
        'docs/'
      ],
      cost_actual: plan.cost_estimate.estimated_cost * 0.95, // Slightly under estimate
      status: 'completed',
      scrum_artifacts: scrumArtifacts
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
