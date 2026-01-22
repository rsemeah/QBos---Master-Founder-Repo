// packages/war-room/cli/commands/health.ts
import { warRoom } from '../../src'

export async function healthCommand() {
  console.log('🏥 Running health check...\n')

  const health = await warRoom.health.getStatus()

  console.log(`Overall: ${health.overall.toUpperCase()}`)
  console.log(`\nDetailed Report:`)
  console.log(JSON.stringify(health, null, 2))
}
