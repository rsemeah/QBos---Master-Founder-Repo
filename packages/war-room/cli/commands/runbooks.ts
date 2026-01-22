// packages/war-room/cli/commands/runbooks.ts
import { runbookManager } from '../../src/runbooks'

export async function runbooksCommand(action: string, ...args: string[]) {
  switch (action) {
    case 'list':
      await listRunbooks()
      break

    case 'execute':
      const runbookId = args[0]
      const reason = args.slice(1).join(' ') || 'Manual execution'
      if (!runbookId) {
        console.error('Error: Runbook ID required')
        console.log('Usage: runbooks execute <runbook-id> [reason...]')
        return
      }
      await executeRunbook(runbookId, reason)
      break

    case 'check':
      await checkTriggers()
      break

    default:
      console.log('Usage: runbooks <list|execute|check> [args...]')
      console.log('\nExamples:')
      console.log('  runbooks list')
      console.log('  runbooks execute high-error-rate "Manual intervention"')
      console.log('  runbooks check')
  }
}

async function listRunbooks() {
  const runbooks = runbookManager.listRunbooks()

  console.log('📚 Available Runbooks\n')

  for (const runbook of runbooks) {
    console.log(`${runbook.id}`)
    console.log(`  Name: ${runbook.name}`)
    console.log(`  Description: ${runbook.description}`)
    console.log(`  Trigger: ${runbook.trigger.type}`)
    console.log(`  Auto-execute: ${runbook.auto_execute ? 'Yes' : 'No'}`)
    console.log(`  Actions: ${runbook.actions.length}`)
    console.log()
  }
}

async function executeRunbook(runbookId: string, reason: string) {
  console.log(`🔧 Executing runbook: ${runbookId}`)
  console.log(`Reason: ${reason}\n`)

  try {
    const execution = await runbookManager.executeRunbook(runbookId, reason)

    if (execution.success) {
      console.log('\n✅ Runbook executed successfully')
      console.log(`\nActions taken:`)
      for (const action of execution.actions_taken) {
        console.log(`  ✓ ${action}`)
      }
      console.log(`\nReceipt ID: ${execution.receipt_id}`)
    } else {
      console.log('\n❌ Runbook execution failed')
      console.log(`Error: ${execution.error}`)
    }
  } catch (error) {
    console.error('Failed to execute runbook:', error)
  }
}

async function checkTriggers() {
  console.log('🔍 Checking runbook triggers...\n')

  try {
    const executions = await runbookManager.checkTriggers()

    if (executions.length === 0) {
      console.log('✅ No runbooks triggered')
      return
    }

    console.log(`⚡ ${executions.length} runbook(s) auto-executed:\n`)

    for (const execution of executions) {
      console.log(`  ${execution.runbook_id}`)
      console.log(`  Status: ${execution.success ? '✅ Success' : '❌ Failed'}`)
      console.log(`  Reason: ${execution.trigger}`)
      if (execution.actions_taken.length > 0) {
        console.log(`  Actions:`)
        for (const action of execution.actions_taken) {
          console.log(`    - ${action}`)
        }
      }
      console.log()
    }
  } catch (error) {
    console.error('Failed to check triggers:', error)
  }
}
