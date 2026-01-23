#!/usr/bin/env tsx
// scripts/measure-autonomy.ts

/**
 * Autonomy Measurement Script
 *
 * Runs Robby PA end-to-end and measures operational autonomy from receipts.
 *
 * TruthSerum-Compliant Measurement:
 * - Counts human interventions from receipts
 * - Counts autonomous steps from receipts
 * - Calculates autonomy percentage
 * - Stores results with proof artifacts
 *
 * Usage:
 *   tsx scripts/measure-autonomy.ts
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface AutonomyMeasurement {
  session_id: string
  intent: string
  autonomy_level: number
  timestamp: string
  total_steps: number
  autonomous_steps: number
  human_interventions: number
  autonomy_percentage: number
  receipts_analyzed: number
  test_duration_seconds: number
  build_result: 'success' | 'failure'
}

async function measureAutonomy(): Promise<AutonomyMeasurement> {
  const sessionId = `autonomy-measurement-${Date.now()}`
  const intent = 'Simple todo app with user authentication'
  const startTime = Date.now()

  console.log('\n' + '='.repeat(70))
  console.log('🔬 ROBBY PA AUTONOMY MEASUREMENT')
  console.log('='.repeat(70))
  console.log(`\nSession ID: ${sessionId}`)
  console.log(`Intent: "${intent}"`)
  console.log(`Autonomy Level: 2 (Guided Execution)`)
  console.log(`Budget Cap: $5`)
  console.log('\n' + '='.repeat(70) + '\n')

  // Step 1: Run Robby PA build command
  console.log('📊 Step 1: Executing Robby PA build...\n')

  let buildResult: 'success' | 'failure' = 'success'

  try {
    // Execute robby build (will use deterministic fallback since no Groq API key)
    const command = `cd apps/robby && node -r tsx/esm src/cli.ts build "${intent}" --level 2`

    console.log(`Running: ${command}\n`)

    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        SESSION_ID: sessionId
      }
    })

    console.log('\n✅ Build completed successfully\n')
  } catch (error) {
    console.error('\n❌ Build failed:', error)
    buildResult = 'failure'
  }

  // Step 2: Analyze receipts
  console.log('📊 Step 2: Analyzing receipts...\n')

  const receipts = await collectReceipts(sessionId)

  if (receipts.length === 0) {
    console.warn('⚠️  No receipts found - using mock data for demonstration\n')
    return generateMockMeasurement(sessionId, intent, startTime, buildResult)
  }

  const analysis = analyzeReceipts(receipts)

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  const measurement: AutonomyMeasurement = {
    session_id: sessionId,
    intent,
    autonomy_level: 2,
    timestamp: new Date().toISOString(),
    total_steps: analysis.total_steps,
    autonomous_steps: analysis.autonomous_steps,
    human_interventions: analysis.human_interventions,
    autonomy_percentage: analysis.autonomy_percentage,
    receipts_analyzed: receipts.length,
    test_duration_seconds: Math.round(duration),
    build_result: buildResult
  }

  // Step 3: Store results
  await storeResults(measurement, receipts)

  // Step 4: Display results
  displayResults(measurement)

  return measurement
}

interface ReceiptAnalysis {
  total_steps: number
  autonomous_steps: number
  human_interventions: number
  autonomy_percentage: number
}

function analyzeReceipts(receipts: any[]): ReceiptAnalysis {
  let autonomous_steps = 0
  let human_interventions = 0

  for (const receipt of receipts) {
    // Count execution steps
    if (receipt.type === 'execution.step.completed') {
      autonomous_steps++
    }

    // Count human interventions
    if (receipt.type === 'execution.needs_input' || receipt.type === 'execution.approval_required') {
      human_interventions++
    }

    // Count autonomy decisions
    if (receipt.type === 'brainsmart.decision') {
      autonomous_steps++
    }

    // Count scope locks (autonomous decision)
    if (receipt.type === 'ethos.scope.locked') {
      autonomous_steps++
    }
  }

  const total_steps = autonomous_steps + human_interventions
  const autonomy_percentage = total_steps > 0
    ? Math.round((autonomous_steps / total_steps) * 100)
    : 0

  return {
    total_steps,
    autonomous_steps,
    human_interventions,
    autonomy_percentage
  }
}

async function collectReceipts(sessionId: string): Promise<any[]> {
  // Try to read receipts from local storage
  const receiptsDir = path.join(process.cwd(), 'receipts')

  if (!fs.existsSync(receiptsDir)) {
    return []
  }

  const files = fs.readdirSync(receiptsDir)
  const receipts: any[] = []

  for (const file of files) {
    if (!file.endsWith('.jsonl')) continue

    const filePath = path.join(receiptsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    const lines = content.trim().split('\n').filter(Boolean)

    for (const line of lines) {
      try {
        const receipt = JSON.parse(line)
        if (receipt.sessionId === sessionId) {
          receipts.push(receipt)
        }
      } catch (error) {
        // Skip invalid JSON lines
      }
    }
  }

  return receipts
}

function generateMockMeasurement(
  sessionId: string,
  intent: string,
  startTime: number,
  buildResult: 'success' | 'failure'
): AutonomyMeasurement {
  // Mock data based on typical L2 build
  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  return {
    session_id: sessionId,
    intent,
    autonomy_level: 2,
    timestamp: new Date().toISOString(),
    total_steps: 15, // Mock: 15 total steps
    autonomous_steps: 12, // Mock: 12 autonomous
    human_interventions: 3, // Mock: 3 human approvals
    autonomy_percentage: 80, // Mock: 80% autonomy
    receipts_analyzed: 0, // No actual receipts
    test_duration_seconds: Math.round(duration),
    build_result: buildResult
  }
}

async function storeResults(measurement: AutonomyMeasurement, receipts: any[]) {
  const date = new Date().toISOString().split('T')[0]
  const proofDir = path.join(process.cwd(), 'proof', `autonomy-measurement-${date}`)

  // Create proof directory
  if (!fs.existsSync(proofDir)) {
    fs.mkdirSync(proofDir, { recursive: true })
  }

  // Write measurement result
  const measurementPath = path.join(proofDir, 'measurement.json')
  fs.writeFileSync(measurementPath, JSON.stringify(measurement, null, 2))

  // Write receipts
  const receiptsPath = path.join(proofDir, 'receipts.jsonl')
  const receiptsContent = receipts.map(r => JSON.stringify(r)).join('\n')
  fs.writeFileSync(receiptsPath, receiptsContent)

  // Write README
  const readmePath = path.join(proofDir, 'README.md')
  const readme = generateReadme(measurement)
  fs.writeFileSync(readmePath, readme)

  console.log(`\n📁 Results stored in: ${proofDir}\n`)
}

function generateReadme(measurement: AutonomyMeasurement): string {
  return `# Robby PA Autonomy Measurement

**Session ID:** ${measurement.session_id}
**Timestamp:** ${measurement.timestamp}
**Intent:** "${measurement.intent}"

## Results

| Metric | Value |
|--------|-------|
| **Autonomy Level** | L${measurement.autonomy_level} (Guided Execution) |
| **Total Steps** | ${measurement.total_steps} |
| **Autonomous Steps** | ${measurement.autonomous_steps} |
| **Human Interventions** | ${measurement.human_interventions} |
| **Autonomy Percentage** | **${measurement.autonomy_percentage}%** |
| **Build Result** | ${measurement.build_result === 'success' ? '✅ Success' : '❌ Failure'} |
| **Test Duration** | ${measurement.test_duration_seconds}s |
| **Receipts Analyzed** | ${measurement.receipts_analyzed} |

## TruthSerum Status

${measurement.receipts_analyzed > 0 ? `
**Status:** Verified (with receipts)

${measurement.receipts_analyzed} receipts analyzed from session ${measurement.session_id}.
` : `
**Status:** Unknown (no receipts)

This measurement used mock data because no receipts were found for session ${measurement.session_id}.

To get verified measurement:
1. Ensure TruthSerum ReceiptWriter is configured
2. Run Robby PA build with receipt emission enabled
3. Re-run this measurement script
`}

## Interpretation

${getInterpretation(measurement)}

## Files

- \`measurement.json\` - Structured measurement data
- \`receipts.jsonl\` - TruthSerum receipts from build session
- \`README.md\` - This file

## Methodology

1. Execute Robby PA build command end-to-end
2. Collect all TruthSerum receipts for session
3. Count autonomous steps vs. human interventions
4. Calculate autonomy percentage: \`(autonomous_steps / total_steps) * 100\`
5. Store results with proof artifacts

## Next Steps

${measurement.autonomy_percentage < 50 ? '- Review state machine to reduce human intervention gates' : ''}
${measurement.receipts_analyzed === 0 ? '- Enable TruthSerum receipt emission for verified measurement' : ''}
- Add autonomy tracking to CI/CD pipeline
- Set autonomy percentage targets per level
- Monitor autonomy over time (regression testing)
`
}

function getInterpretation(measurement: AutonomyMeasurement): string {
  const pct = measurement.autonomy_percentage

  if (pct >= 90) {
    return `**Highly Autonomous (${pct}%)** - Robby PA is operating with minimal human intervention. Most decisions are made autonomously.`
  } else if (pct >= 70) {
    return `**Moderately Autonomous (${pct}%)** - Robby PA makes most decisions autonomously, with occasional human approval required. This is expected for L2 (Guided Execution).`
  } else if (pct >= 50) {
    return `**Partially Autonomous (${pct}%)** - Robby PA requires regular human intervention. Consider reducing approval gates for routine decisions.`
  } else if (pct >= 30) {
    return `**Limited Autonomy (${pct}%)** - Robby PA relies heavily on human decisions. Review state machine to increase autonomous capabilities.`
  } else {
    return `**Minimal Autonomy (${pct}%)** - Robby PA is operating mostly in manual mode. This may be expected for L0-L1, but unusual for L2+.`
  }
}

function displayResults(measurement: AutonomyMeasurement) {
  console.log('\n' + '='.repeat(70))
  console.log('📊 AUTONOMY MEASUREMENT RESULTS')
  console.log('='.repeat(70))
  console.log(`\nSession: ${measurement.session_id}`)
  console.log(`Intent: "${measurement.intent}"`)
  console.log(`Level: L${measurement.autonomy_level} (Guided Execution)`)
  console.log(`\nSteps:`)
  console.log(`  Total: ${measurement.total_steps}`)
  console.log(`  Autonomous: ${measurement.autonomous_steps}`)
  console.log(`  Human Interventions: ${measurement.human_interventions}`)
  console.log(`\n🎯 Autonomy Percentage: ${measurement.autonomy_percentage}%`)
  console.log(`\nBuild: ${measurement.build_result === 'success' ? '✅ Success' : '❌ Failure'}`)
  console.log(`Duration: ${measurement.test_duration_seconds}s`)
  console.log(`Receipts: ${measurement.receipts_analyzed}`)
  console.log('\n' + '='.repeat(70))

  console.log(`\n${getInterpretation(measurement)}\n`)

  if (measurement.receipts_analyzed === 0) {
    console.log('⚠️  WARNING: No receipts found - measurement used mock data')
    console.log('   Enable TruthSerum receipt emission for verified measurement\n')
  }
}

// Run measurement
measureAutonomy()
  .then(() => {
    console.log('✅ Autonomy measurement complete\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Measurement failed:', error)
    process.exit(1)
  })
