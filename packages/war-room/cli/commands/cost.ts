// packages/war-room/cli/commands/cost.ts
import { warRoom } from '../../src'
import type { CostCap, RoutingOverride } from '../../src/cost'

export async function costCommand(action: string, ...args: string[]) {
  switch (action) {
    case 'status':
      await costStatus()
      break

    case 'set-cap':
      const budget = parseFloat(args[0])
      if (isNaN(budget)) {
        console.error('Error: Budget must be a number')
        return
      }
      await setCap({ monthly_budget: budget })
      break

    case 'override':
      const model = args[0]
      const reason = args.slice(1).join(' ') || 'Manual override'
      await setRoutingOverride(model, reason)
      break

    case 'clear-override':
      await clearRoutingOverride()
      break

    default:
      console.log('Usage: cost <status|set-cap|override|clear-override> [args...]')
      console.log('\nExamples:')
      console.log('  cost status')
      console.log('  cost set-cap 1000')
      console.log('  cost override gpt-3.5-turbo "Cost reduction"')
      console.log('  cost clear-override')
  }
}

async function costStatus() {
  const health = await warRoom.cost.getHealth()
  const override = warRoom.cost.getRoutingOverride()

  console.log('💰 Cost Status\n')
  console.log(`Status: ${health.status.toUpperCase()}`)
  console.log(`Current rate: $${health.current_spend_rate.toFixed(2)}/hour`)
  console.log(`Projected monthly: $${health.projected_monthly.toFixed(2)}`)
  console.log(`Budget remaining: $${health.budget_remaining.toFixed(2)}`)
  console.log(`Kill threshold: $${health.kill_threshold.toFixed(2)}`)
  console.log(`At risk: ${health.at_risk ? '⚠️  YES' : '✅ No'}`)

  if (override.enabled) {
    console.log('\n⚠️  Routing Override Active:')
    console.log(`  Model: ${override.force_model}`)
    console.log(`  Reason: ${override.reason}`)
    if (override.expires_at) {
      console.log(`  Expires: ${override.expires_at}`)
    }
  }
}

async function setCap(cap: Partial<CostCap>) {
  console.log(`💰 Setting cost cap...`)
  console.log(`Monthly budget: $${cap.monthly_budget}\n`)

  await warRoom.cost.setCap(cap)

  console.log('✅ Cost cap updated')
}

async function setRoutingOverride(model: string, reason: string) {
  console.log(`⚠️  Setting routing override...`)
  console.log(`Model: ${model}`)
  console.log(`Reason: ${reason}\n`)

  const override: RoutingOverride = {
    enabled: true,
    force_model: model,
    reason
  }

  await warRoom.cost.setRoutingOverride(override)

  console.log('✅ Routing override set')
}

async function clearRoutingOverride() {
  console.log('🔄 Clearing routing override...\n')

  await warRoom.cost.clearRoutingOverride()

  console.log('✅ Routing override cleared')
}
