#!/usr/bin/env node
// packages/war-room/cli/index.ts
import { statusCommand } from './commands/status'
import { healthCommand } from './commands/health'
import { regressCommand } from './commands/regress'
import { robbyCommand } from './commands/robby'
import { costCommand } from './commands/cost'
import { freezeCommand } from './commands/freeze'
import { impactCommand } from './commands/impact'
import { driftCommand } from './commands/drift'
import { runbooksCommand } from './commands/runbooks'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    printHelp()
    return
  }

  try {
    switch (command) {
      case 'status':
        await statusCommand()
        break

      case 'health':
        await healthCommand()
        break

      case 'regress':
        await regressCommand(args[1])
        break

      case 'robby':
        await robbyCommand(args[1], ...args.slice(2))
        break

      case 'cost':
        await costCommand(args[1], ...args.slice(2))
        break

      case 'freeze':
        await freezeCommand(args[1], ...args.slice(2))
        break

      case 'impact':
        await impactCommand(args[1], ...args.slice(2))
        break

      case 'drift':
        await driftCommand(args[1], ...args.slice(2))
        break

      case 'runbooks':
        await runbooksCommand(args[1], ...args.slice(2))
        break

      case 'help':
      case '--help':
      case '-h':
        printHelp()
        break

      default:
        console.error(`Unknown command: ${command}`)
        console.log('Run "war-room help" for usage information')
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

function printHelp() {
  console.log(`
🏛️  War Room CLI - QuietBuild OS Operations Control

Usage: war-room <command> [options]

Commands:
  status              Show overall system status
  health              Run health check across all systems
  regress [profile]   Run regression tests (all or specific profile)
  robby <action>      Manage Robby PA autonomy
  cost <action>       Manage cost and routing
  freeze <action>     Freeze/unfreeze system operations
  impact <action>     Analyze commit impact and correlate degradations
  drift <action>      Detect behavioral drift from baseline
  runbooks <action>   Execute automated remediation runbooks

Examples:
  war-room status
  war-room health
  war-room regress default
  war-room robby status
  war-room robby downgrade 1 "High error rate"
  war-room cost status
  war-room cost set-cap 1000
  war-room freeze freeze "Deployment in progress"
  war-room freeze unfreeze
  war-room impact analyze abc123
  war-room drift detect
  war-room runbooks list

For detailed help on a specific command:
  war-room <command> --help
`)
}

main()
