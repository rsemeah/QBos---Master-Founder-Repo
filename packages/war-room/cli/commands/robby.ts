// packages/war-room/cli/commands/robby.ts
import { warRoom } from '../../src'
import type { AutonomyLevel } from '../../src/robby'

export async function robbyCommand(action: string, ...args: string[]) {
  switch (action) {
    case 'status':
      await robbyStatus()
      break

    case 'downgrade':
      const downgradeLevel = parseInt(args[0]) as AutonomyLevel
      const downgradeReason = args.slice(1).join(' ') || 'Manual downgrade'
      await robbyDowngrade(downgradeLevel, downgradeReason)
      break

    case 'upgrade':
      const upgradeLevel = parseInt(args[0]) as AutonomyLevel
      const upgradeReason = args.slice(1).join(' ') || 'Manual upgrade'
      await robbyUpgrade(upgradeLevel, upgradeReason)
      break

    case 'kill':
      const killReason = args.join(' ') || 'Manual kill'
      await robbyKill(killReason)
      break

    default:
      console.log('Usage: robby <status|downgrade|upgrade|kill> [args...]')
      console.log('\nExamples:')
      console.log('  robby status')
      console.log('  robby downgrade 1 "High error rate detected"')
      console.log('  robby upgrade 3 "System stable"')
      console.log('  robby kill "Emergency stop"')
  }
}

async function robbyStatus() {
  const health = await warRoom.robby.getHealth()

  console.log('🤖 Robby PA Status\n')
  console.log(`Status: ${health.status.toUpperCase()}`)
  console.log(`Autonomy level: ${health.autonomy_level}`)
  console.log(`Blocked actions (24h): ${health.blocked_actions_24h}`)
  console.log(`Human interrupts (24h): ${health.human_interrupts_24h}`)
  console.log(`Confidence delta: ${health.confidence_delta.toFixed(3)}`)
  console.log(`In scope: ${health.in_scope ? '✅' : '❌'}`)
}

async function robbyDowngrade(level: AutonomyLevel, reason: string) {
  const current = warRoom.robby.getAutonomyLevel()
  console.log(`🔽 Downgrading Robby from level ${current} to ${level}...`)
  console.log(`Reason: ${reason}\n`)

  await warRoom.robby.downgrade(level, reason)

  console.log('✅ Autonomy level downgraded')
}

async function robbyUpgrade(level: AutonomyLevel, reason: string) {
  const current = warRoom.robby.getAutonomyLevel()
  console.log(`🔼 Upgrading Robby from level ${current} to ${level}...`)
  console.log(`Reason: ${reason}\n`)

  await warRoom.robby.upgrade(level, reason)

  console.log('✅ Autonomy level upgraded')
}

async function robbyKill(reason: string) {
  console.log('🚨 KILLING ROBBY PA...')
  console.log(`Reason: ${reason}\n`)

  await warRoom.robby.kill(reason)

  console.log('✅ Robby PA killed (autonomy level set to 0)')
}
