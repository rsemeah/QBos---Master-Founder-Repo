// packages/war-room/src/runbooks/index.ts
import { ReceiptWriter } from '@qbos/truthserum'
import { warRoom } from '../index'

export interface Runbook {
  id: string
  name: string
  description: string
  trigger: RunbookTrigger
  actions: RunbookAction[]
  auto_execute: boolean
}

export interface RunbookTrigger {
  type: 'health_degraded' | 'cost_exceeded' | 'drift_detected' | 'error_spike' | 'manual'
  condition?: string
  threshold?: number
}

export interface RunbookAction {
  type: 'downgrade_robby' | 'freeze_system' | 'override_routing' | 'notify' | 'run_command'
  params: Record<string, any>
  description: string
}

export interface RunbookExecution {
  runbook_id: string
  timestamp: string
  trigger: string
  actions_taken: string[]
  success: boolean
  error?: string
  receipt_id: string
}

export class RunbookManager {
  private runbooks: Map<string, Runbook> = new Map()

  constructor() {
    // Initialize built-in runbooks
    this.registerBuiltInRunbooks()
  }

  /**
   * Register a new runbook
   */
  registerRunbook(runbook: Runbook): void {
    this.runbooks.set(runbook.id, runbook)
  }

  /**
   * Execute a runbook by ID
   */
  async executeRunbook(runbookId: string, reason: string): Promise<RunbookExecution> {
    const runbook = this.runbooks.get(runbookId)

    if (!runbook) {
      throw new Error(`Runbook not found: ${runbookId}`)
    }

    const execution: RunbookExecution = {
      runbook_id: runbookId,
      timestamp: new Date().toISOString(),
      trigger: reason,
      actions_taken: [],
      success: false,
      receipt_id: ''
    }

    try {
      console.log(`🔧 Executing runbook: ${runbook.name}`)
      console.log(`   Reason: ${reason}`)

      for (const action of runbook.actions) {
        try {
          await this.executeAction(action)
          execution.actions_taken.push(`${action.type}: ${action.description}`)
        } catch (error) {
          console.error(`   ✗ Action failed: ${action.type}`, error)
          execution.error = error instanceof Error ? error.message : String(error)
          throw error
        }
      }

      execution.success = true
      console.log(`   ✓ Runbook completed successfully`)

    } catch (error) {
      console.error(`   ✗ Runbook failed:`, error)
      execution.success = false
      execution.error = error instanceof Error ? error.message : String(error)
    }

    // Emit receipt
    const receipt = await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'runbook.executed',
      details: execution
    })

    execution.receipt_id = receipt.id

    return execution
  }

  /**
   * Check triggers and auto-execute runbooks
   */
  async checkTriggers(): Promise<RunbookExecution[]> {
    const executions: RunbookExecution[] = []

    for (const [id, runbook] of this.runbooks) {
      if (!runbook.auto_execute) continue

      const shouldExecute = await this.shouldExecuteRunbook(runbook)

      if (shouldExecute.execute) {
        console.log(`⚡ Auto-executing runbook: ${runbook.name}`)
        try {
          const execution = await this.executeRunbook(id, shouldExecute.reason)
          executions.push(execution)
        } catch (error) {
          console.error(`Failed to auto-execute runbook ${id}:`, error)
        }
      }
    }

    return executions
  }

  /**
   * List all registered runbooks
   */
  listRunbooks(): Runbook[] {
    return Array.from(this.runbooks.values())
  }

  private async executeAction(action: RunbookAction): Promise<void> {
    console.log(`   → ${action.description}`)

    switch (action.type) {
      case 'downgrade_robby':
        await warRoom.robby.downgrade(
          action.params.level,
          action.params.reason || 'Automatic downgrade by runbook'
        )
        break

      case 'freeze_system':
        await warRoom.controls.freeze(
          action.params.reason || 'Automatic freeze by runbook',
          'runbook-manager'
        )
        break

      case 'override_routing':
        await warRoom.cost.setRoutingOverride({
          enabled: true,
          force_model: action.params.model,
          reason: action.params.reason || 'Automatic routing override by runbook',
          expires_at: action.params.expires_at
        })
        break

      case 'notify':
        // Emit notification receipt
        await ReceiptWriter.write({
          sessionId: 'war-room',
          type: 'runbook.notification',
          details: {
            message: action.params.message,
            severity: action.params.severity || 'yellow'
          }
        })
        break

      case 'run_command':
        // For now, just log - in production, could use child_process
        console.log(`   Command: ${action.params.command}`)
        break

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async shouldExecuteRunbook(runbook: Runbook): Promise<{
    execute: boolean
    reason: string
  }> {
    switch (runbook.trigger.type) {
      case 'health_degraded':
        const health = await warRoom.health.getStatus()
        if (health.overall === 'red' || health.overall === 'critical') {
          return {
            execute: true,
            reason: `Health degraded to ${health.overall}`
          }
        }
        break

      case 'cost_exceeded':
        const cost = await warRoom.cost.getHealth()
        const threshold = runbook.trigger.threshold || 0.9
        const budgetUsed = 1 - (cost.budget_remaining / 1000) // Assume $1000 budget

        if (budgetUsed >= threshold) {
          return {
            execute: true,
            reason: `Budget usage exceeded ${(threshold * 100).toFixed(0)}%`
          }
        }
        break

      case 'error_spike':
        // Check for error rate spike across engines
        const status = await warRoom.health.getStatus()
        const highErrorEngines = status.engines.filter(e => e.error_rate > 0.1)

        if (highErrorEngines.length > 0) {
          return {
            execute: true,
            reason: `Error spike detected in ${highErrorEngines.length} engine(s)`
          }
        }
        break
    }

    return { execute: false, reason: '' }
  }

  private registerBuiltInRunbooks(): void {
    // Runbook 1: High Error Rate Response
    this.registerRunbook({
      id: 'high-error-rate',
      name: 'High Error Rate Response',
      description: 'Respond to sustained high error rates by downgrading Robby and routing to stable model',
      trigger: {
        type: 'error_spike',
        threshold: 0.1
      },
      actions: [
        {
          type: 'notify',
          params: {
            message: 'High error rate detected - initiating response runbook',
            severity: 'red'
          },
          description: 'Notify operators'
        },
        {
          type: 'downgrade_robby',
          params: {
            level: 1,
            reason: 'High error rate detected'
          },
          description: 'Downgrade Robby to level 1'
        },
        {
          type: 'override_routing',
          params: {
            model: 'gpt-3.5-turbo',
            reason: 'Fallback to stable model due to errors',
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
          },
          description: 'Override routing to stable model'
        }
      ],
      auto_execute: true
    })

    // Runbook 2: Cost Emergency
    this.registerRunbook({
      id: 'cost-emergency',
      name: 'Cost Emergency Response',
      description: 'Emergency response when budget is critically exceeded',
      trigger: {
        type: 'cost_exceeded',
        threshold: 0.95
      },
      actions: [
        {
          type: 'notify',
          params: {
            message: 'CRITICAL: Budget 95% depleted - emergency measures activated',
            severity: 'critical'
          },
          description: 'Critical cost alert'
        },
        {
          type: 'override_routing',
          params: {
            model: 'gpt-3.5-turbo',
            reason: 'Emergency cost reduction'
          },
          description: 'Force cheapest model'
        },
        {
          type: 'downgrade_robby',
          params: {
            level: 0,
            reason: 'Budget emergency - manual approval required'
          },
          description: 'Disable Robby autonomy'
        }
      ],
      auto_execute: true
    })

    // Runbook 3: Health Degradation
    this.registerRunbook({
      id: 'health-degraded',
      name: 'Health Degradation Response',
      description: 'Respond to overall system health degradation',
      trigger: {
        type: 'health_degraded'
      },
      actions: [
        {
          type: 'notify',
          params: {
            message: 'System health degraded - investigating',
            severity: 'red'
          },
          description: 'Alert operators'
        },
        {
          type: 'downgrade_robby',
          params: {
            level: 1,
            reason: 'Health degradation detected'
          },
          description: 'Reduce Robby autonomy'
        }
      ],
      auto_execute: false // Requires manual confirmation
    })

    // Runbook 4: Emergency Freeze
    this.registerRunbook({
      id: 'emergency-freeze',
      name: 'Emergency System Freeze',
      description: 'Immediately freeze all operations',
      trigger: {
        type: 'manual'
      },
      actions: [
        {
          type: 'notify',
          params: {
            message: 'EMERGENCY FREEZE INITIATED',
            severity: 'critical'
          },
          description: 'Critical freeze alert'
        },
        {
          type: 'freeze_system',
          params: {
            reason: 'Emergency freeze activated'
          },
          description: 'Freeze all operations'
        },
        {
          type: 'downgrade_robby',
          params: {
            level: 0,
            reason: 'Emergency freeze'
          },
          description: 'Kill Robby autonomy'
        }
      ],
      auto_execute: false
    })
  }
}

// Singleton instance
export const runbookManager = new RunbookManager()
