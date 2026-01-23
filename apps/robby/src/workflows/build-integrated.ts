// apps/robby/src/workflows/build.ts (MODIFIED)

/**
 * BuildWorkflow - Integrated with robby-pa orchestrator
 *
 * Wires the CLI build command to the proven 91.67% autonomous orchestrator
 */

import { executeTask, type Task } from '../../../../packages/robby-pa/dist/orchestrator.js'
import { type Receipt } from '../../../../packages/robby-pa/dist/receipt.js'
import { AutonomyGuard, type AutonomyLevel } from '../policy/autonomy.js'

export interface BuildIntent {
  description: string
  type: 'web-app' | 'ios-app' | 'api' | 'service'
  autonomy_level?: AutonomyLevel
  budget_override?: number
}

export interface BuildResult {
  success: boolean
  build_id: string
  duration_seconds: number
  cost_actual: number
  receipts: string[]
  artifacts: string[]
  error?: string
}

export class BuildWorkflow {
  private autonomyGuard = new AutonomyGuard()

  async execute(intent: BuildIntent): Promise<BuildResult> {
    const sessionId = `build-${Date.now()}`
    const startTime = Date.now()
    const autonomyLevel = intent.autonomy_level || 2

    console.log(`\n🤖 Starting build with ${autonomyLevel} autonomy...\n`)

    try {
      // Step 1: Autonomy check
      const autonomyCheck = this.autonomyGuard.checkAction('build', {
        cost_estimate: 5,
        step_count: 12
      })

      if (!autonomyCheck.allowed) {
        throw new Error(`Autonomy check failed: ${autonomyCheck.reason}`)
      }

      console.log(`✅ Autonomy check passed (L${autonomyLevel})\n`)

      // Step 2: Define build tasks (from your orchestrator)
      const tasks: Task[] = [
        {
          id: 'scaffold',
          engine: 'ExecutionEngine',
          intent: 'Create project structure',
          params: { type: intent.type }
        },
        {
          id: 'plan',
          engine: 'BrainSmart',
          intent: `Generate build plan for: ${intent.description}`,
          params: { intent: intent.description, type: intent.type }
        },
        {
          id: 'scope-lock',
          engine: 'EthosEngine',
          intent: 'Lock project scope',
          params: {}
        },
        {
          id: 'codegen',
          engine: 'ExecutionEngine',
          intent: 'Generate code from plan',
          params: {}
        },
        {
          id: 'lint',
          engine: 'ExecutionEngine',
          intent: 'Run linter',
          params: {}
        },
        {
          id: 'test',
          engine: 'ExecutionEngine',
          intent: 'Run tests',
          params: {},
          requiredProofs: ['lint.passed']
        },
        {
          id: 'build',
          engine: 'ExecutionEngine',
          intent: 'Build artifacts',
          params: {}
        },
        {
          id: 'verify',
          engine: 'ExecutionEngine',
          intent: 'Verify build',
          params: {}
        }
      ]

      // Step 3: Execute tasks using your proven orchestrator
      const results = []
      const receipts = []

      // Create receipt store compatible with robby-pa orchestrator
      const receiptStore = {
        async getLastReceiptForSession(sessionId: string): Promise<Receipt | null> {
          const sessionReceipts = receipts.filter(r => r.sessionId === sessionId)
          if (sessionReceipts.length === 0) return null
          return sessionReceipts[sessionReceipts.length - 1]
        },
        async insertReceipt(r: any): Promise<Receipt> {
          const receipt = r as Receipt
          receipts.push(receipt)
          return receipt
        }
      }

      for (const task of tasks) {
        console.log(`⚙️  Executing: ${task.id} (${task.engine})...`)

        const result = await executeTask(sessionId, task, receiptStore)

        if (result.success) {
          console.log(`   ✅ ${task.id} completed`)
          results.push(result)
        } else {
          console.log(`   ❌ ${task.id} failed`)
          throw new Error(`Task ${task.id} failed`)
        }
      }

      // Step 4: Calculate metrics
      const endTime = Date.now()
      const duration = Math.round((endTime - startTime) / 1000)

      // Count autonomous vs intervention steps
      const autonomousSteps = receipts.filter(r =>
        r.type === 'task.started' || r.type === 'task.completed'
      ).length

      const interventionSteps = receipts.filter(r =>
        r.type === 'task.approval_required'
      ).length

      const autonomyPercentage = Math.round(
        (autonomousSteps / (autonomousSteps + interventionSteps)) * 100
      )

      console.log(`\n📊 Build Metrics:`)
      console.log(`   Autonomous steps: ${autonomousSteps}`)
      console.log(`   Interventions: ${interventionSteps}`)
      console.log(`   Autonomy: ${autonomyPercentage}%`)

      return {
        success: true,
        build_id: sessionId,
        duration_seconds: duration,
        cost_actual: 0, // TODO: Track actual cost
        receipts: receipts.map(r => r.id),
        artifacts: results.flatMap(r => r.result?.artifacts || [])
      }

    } catch (error) {
      const endTime = Date.now()
      const duration = Math.round((endTime - startTime) / 1000)

      return {
        success: false,
        build_id: sessionId,
        duration_seconds: duration,
        cost_actual: 0,
        receipts: [],
        artifacts: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
