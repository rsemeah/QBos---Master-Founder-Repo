// packages/war-room/cli/commands/impact.ts
import { ImpactAnalyzer } from '../../src/impact'

export async function impactCommand(action: string, ...args: string[]) {
  const analyzer = new ImpactAnalyzer()

  switch (action) {
    case 'analyze':
      const commitSha = args[0]
      if (!commitSha) {
        console.error('Error: Commit SHA required')
        console.log('Usage: impact analyze <commit-sha>')
        return
      }
      await analyzeCommit(analyzer, commitSha)
      break

    case 'recent':
      const hours = parseInt(args[0]) || 24
      await analyzeRecent(analyzer, hours)
      break

    case 'correlate':
      await correlateDegradation(analyzer)
      break

    default:
      console.log('Usage: impact <analyze|recent|correlate> [args...]')
      console.log('\nExamples:')
      console.log('  impact analyze abc123')
      console.log('  impact recent 24')
      console.log('  impact correlate')
  }
}

async function analyzeCommit(analyzer: ImpactAnalyzer, commitSha: string) {
  console.log(`🔍 Analyzing impact of commit ${commitSha}...\n`)

  const impact = await analyzer.analyzeCommit(commitSha)

  console.log(`Severity: ${impact.severity.toUpperCase()}`)
  console.log(`Affected engines: ${impact.affected_engines.join(', ') || 'none'}`)
  console.log(`\nDownstream effects:`)

  if (impact.downstream_effects.length === 0) {
    console.log('  No significant effects detected')
  } else {
    for (const effect of impact.downstream_effects) {
      console.log(`  ${effect.severity.toUpperCase()}: ${effect.engine} - ${effect.metric} ${effect.delta}`)
    }
  }
}

async function analyzeRecent(analyzer: ImpactAnalyzer, hours: number) {
  console.log(`🔍 Analyzing recent changes (last ${hours} hours)...\n`)

  const impacts = await analyzer.monitorRecentChanges(hours)

  console.log(`Total commits analyzed: ${impacts.length}`)

  const highImpact = impacts.filter(i => i.severity === 'red' || i.severity === 'critical')

  if (highImpact.length > 0) {
    console.log(`\n⚠️  High-impact changes detected:\n`)
    for (const impact of highImpact) {
      console.log(`  ${impact.severity.toUpperCase()}: ${impact.commit_sha}`)
      console.log(`  Affected: ${impact.affected_engines.join(', ')}`)
      console.log()
    }
  } else {
    console.log('  ✅ No high-impact changes detected')
  }
}

async function correlateDegradation(analyzer: ImpactAnalyzer) {
  console.log('🔍 Correlating health degradation with commits...\n')

  const result = await analyzer.correlateDegradation(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  )

  console.log(`Degradations found: ${result.degradations.length}`)
  console.log(`Likely causes: ${result.likely_causes.length}`)

  if (result.likely_causes.length > 0) {
    console.log('\n🎯 Most likely culprits:\n')
    for (const cause of result.likely_causes) {
      console.log(`  ${cause.commit_sha} (${cause.severity})`)
      console.log(`  Effects:`)
      for (const effect of cause.downstream_effects) {
        console.log(`    - ${effect.engine}: ${effect.metric} ${effect.delta}`)
      }
      console.log()
    }
  } else {
    console.log('  ✅ No clear correlation found')
  }
}
