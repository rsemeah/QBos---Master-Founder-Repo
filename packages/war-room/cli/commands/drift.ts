// packages/war-room/cli/commands/drift.ts
import { DriftDetector } from '../../src/drift'

export async function driftCommand(action: string, ...args: string[]) {
  const detector = new DriftDetector()

  switch (action) {
    case 'detect':
      await detectDrift(detector)
      break

    case 'report':
      const hours = parseInt(args[0]) || 24
      await getDriftReport(detector, hours)
      break

    case 'monitor':
      const interval = parseInt(args[0]) || 60
      await monitorContinuous(detector, interval)
      break

    default:
      console.log('Usage: drift <detect|report|monitor> [args...]')
      console.log('\nExamples:')
      console.log('  drift detect')
      console.log('  drift report 24')
      console.log('  drift monitor 60')
  }
}

async function detectDrift(detector: DriftDetector) {
  console.log('🔍 Detecting drift from baseline...\n')

  const alerts = await detector.detectDrift()

  if (alerts.length === 0) {
    console.log('✅ No significant drift detected')
    console.log('System behavior is within expected parameters\n')
    return
  }

  console.log(`⚠️  ${alerts.length} drift alert(s) detected:\n`)

  for (const alert of alerts) {
    const icon = getSeverityIcon(alert.severity)
    console.log(`${icon} ${alert.severity.toUpperCase()}: ${alert.metric}`)
    console.log(`   ${alert.description}`)
    console.log(`   Baseline: ${alert.baseline.toFixed(3)}`)
    console.log(`   Current:  ${alert.current.toFixed(3)}`)
    console.log()
  }
}

async function getDriftReport(detector: DriftDetector, hours: number) {
  console.log(`📊 Drift Report (last ${hours} hours)\n`)

  const report = await detector.getDriftReport(hours)

  console.log(`Summary: ${report.summary}`)
  console.log(`Recommendation: ${report.recommendation}\n`)

  if (report.alerts.length > 0) {
    console.log('Alerts:\n')
    for (const alert of report.alerts) {
      console.log(`  ${alert.severity.toUpperCase()}: ${alert.metric}`)
      console.log(`  ${alert.description}`)
    }
  }
}

async function monitorContinuous(detector: DriftDetector, intervalMinutes: number) {
  console.log(`👁️  Starting continuous drift monitoring (every ${intervalMinutes} minutes)`)
  console.log('Press Ctrl+C to stop\n')

  // Run once immediately
  await detectDrift(detector)

  // Then monitor continuously
  await detector.monitorContinuous(intervalMinutes)
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'green': return '🟢'
    case 'yellow': return '🟡'
    case 'red': return '🔴'
    case 'critical': return '🚨'
    default: return '⚪'
  }
}
