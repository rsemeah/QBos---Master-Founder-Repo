// packages/war-room/cli/commands/freeze.ts
import { warRoom } from '../../src'

export async function freezeCommand(action: string, ...args: string[]) {
  switch (action) {
    case 'freeze':
      const freezeReason = args.join(' ') || 'Manual freeze'
      await freeze(freezeReason)
      break

    case 'unfreeze':
      await unfreeze()
      break

    case 'status':
      await freezeStatus()
      break

    case 'emergency':
      const emergencyReason = args.join(' ') || 'Emergency stop'
      await emergency(emergencyReason)
      break

    default:
      console.log('Usage: freeze <freeze|unfreeze|status|emergency> [reason...]')
      console.log('\nExamples:')
      console.log('  freeze status')
      console.log('  freeze freeze "Deployment in progress"')
      console.log('  freeze unfreeze')
      console.log('  freeze emergency "Critical security issue"')
  }
}

async function freeze(reason: string) {
  console.log('❄️  FREEZING SYSTEM...')
  console.log(`Reason: ${reason}\n`)

  const state = await warRoom.controls.freeze(reason, 'operator')

  console.log('⛔ SYSTEM FROZEN')
  console.log(`Receipt ID: ${state.receipt_id}`)
}

async function unfreeze() {
  const state = warRoom.controls.getFreezeState()

  if (!state) {
    console.log('✅ System is not frozen')
    return
  }

  console.log('🔓 UNFREEZING SYSTEM...')
  console.log(`Was frozen: ${state.reason}\n`)

  await warRoom.controls.unfreeze('operator')

  console.log('✅ SYSTEM UNFROZEN')
}

async function freezeStatus() {
  const state = warRoom.controls.getFreezeState()

  if (!state) {
    console.log('✅ System is not frozen')
    return
  }

  console.log('⛔ SYSTEM FROZEN\n')
  console.log(`Reason: ${state.reason}`)
  console.log(`Frozen by: ${state.frozen_by}`)
  console.log(`Frozen at: ${state.frozen_at}`)
  console.log(`Receipt ID: ${state.receipt_id}`)
}

async function emergency(reason: string) {
  console.log('🚨 EMERGENCY STOP ACTIVATED')
  console.log(`Reason: ${reason}\n`)

  await warRoom.controls.emergencyStop(reason, 'operator')

  console.log('⛔ SYSTEM FROZEN (EMERGENCY)')
  console.log('All operations halted.')
}
