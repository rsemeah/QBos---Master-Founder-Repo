// apps/robby/src/commands/build.ts

/**
 * Robby PA Build Command
 * Entry point for autonomous builds
 */

import { BuildWorkflow, type BuildIntent } from '../workflows/build-integrated.js'
import { autonomyGuard, type AutonomyLevel } from '../policy/autonomy.js'

export async function buildCommand(args: string[]) {
  // Parse command: robby build "description" [--type TYPE] [--level LEVEL] [--budget AMOUNT]
  const description = args[0]

  if (!description) {
    printHelp()
    return
  }

  // Parse options
  const options = parseOptions(args.slice(1))

  const intent: BuildIntent = {
    description,
    type: (options.type as any) || 'web-app',
    autonomy_level: options.level ? parseInt(options.level) as AutonomyLevel : 2,
    budget_override: options.budget ? parseFloat(options.budget) : undefined
  }

  // Display intent
  console.log('\n' + '='.repeat(60))
  console.log('🤖 Robby PA - Autonomous Build System')
  console.log('='.repeat(60))
  console.log(`\nIntent: "${intent.description}"`)
  console.log(`Type: ${intent.type}`)
  console.log(`Autonomy Level: ${intent.autonomy_level}`)
  console.log(`Budget Cap: $${intent.budget_override || autonomyGuard.getBudgetCap()}`)
  console.log('\n' + '='.repeat(60) + '\n')

  // Execute build workflow
  const workflow = new BuildWorkflow()
  const result = await workflow.execute(intent)

  // Display result
  console.log('='.repeat(60))
  if (result.success) {
    console.log('✅ BUILD SUCCESSFUL')
    console.log('='.repeat(60))
    console.log(`\nBuild ID: ${result.build_id}`)
    console.log(`Duration: ${result.duration_seconds}s`)
    console.log(`Cost: $${result.cost_actual.toFixed(2)}`)
    console.log(`Receipts: ${result.receipts.length}`)

    if (result.artifacts && result.artifacts.length > 0) {
      console.log(`\nArtifacts (${result.artifacts.length}):`)
      result.artifacts.forEach(a => console.log(`  - ${a}`))
    }

    console.log(`\n📋 Receipt IDs:`)
    result.receipts.forEach((r, i) => console.log(`  ${i + 1}. ${r}`))

    console.log('\n' + '='.repeat(60) + '\n')

  } else {
    console.log('❌ BUILD FAILED')
    console.log('='.repeat(60))
    console.log(`\nError: ${result.error}`)
    console.log(`Duration: ${result.duration_seconds}s`)
    console.log(`\n📋 Receipts collected: ${result.receipts.length}`)
    console.log('\n' + '='.repeat(60) + '\n')

    process.exit(1)
  }
}

function parseOptions(args: string[]): Record<string, string> {
  const options: Record<string, string> = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const value = args[i + 1]
      if (value && !value.startsWith('--')) {
        options[key] = value
        i++ // Skip next arg
      }
    }
  }

  return options
}

function printHelp() {
  console.log(`
🤖 Robby PA Build Command

Usage:
  robby build "<description>" [options]

Options:
  --type TYPE       App type: web-app, ios-app, api, service (default: web-app)
  --level LEVEL     Autonomy level: 0-4 (default: 2)
  --budget AMOUNT   Budget override in dollars (default: $5 for L2)

Examples:
  # Build web app with default settings (L2, $5 budget)
  robby build "Create a todo app with authentication"

  # Build iOS app
  robby build "Create a fitness tracking app" --type ios-app

  # Build with higher autonomy (requires prerequisites)
  robby build "Create a SaaS dashboard" --level 3 --budget 20

  # Build API service
  robby build "Create a REST API for user management" --type api

  # Read-only analysis (L1)
  robby build "Estimate complexity of e-commerce platform" --level 1

Autonomy Levels:
  0 - Manual only (no execution)
  1 - Read-only analysis (planning only)
  2 - Guided execution (step approval) [DEFAULT]
  3 - Semi-autonomous (review before release)
  4 - Full autonomy (post-facto review)

See docs/AUTONOMY_POLICY.md for full details.
`)
}
