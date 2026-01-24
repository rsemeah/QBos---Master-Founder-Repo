#!/usr/bin/env tsx
/**
 * Claim Verification Script
 *
 * This script prevents "Documentation Theater" by validating that:
 * 1. No TODOs exist in files marked "complete"
 * 2. No in-memory storage in production engines
 * 3. Tests actually run (not "echo 'Tests coming soon'")
 * 4. README claims match actual implementation
 *
 * Run this in CI/CD to block PRs that inflate claims.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface VerificationResult {
  passed: boolean
  message: string
  severity: 'error' | 'warning'
}

const results: VerificationResult[] = []

// ============================================================================
// GATE 1: No TODOs in Production Code
// ============================================================================

function checkForTODOs(): VerificationResult {
  console.log('\n🔍 Gate 1: Checking for TODOs in production code...')

  const enginePaths = [
    'packages/engines/*/core/src/*.ts',
    'packages/truthserum/src/*.ts',
    'packages/war-room/src/**/*.ts'
  ]

  let foundTODOs = false
  const todoFiles: string[] = []

  for (const pattern of enginePaths) {
    try {
      const output = execSync(
        `find ${pattern.split('*')[0]} -name "*.ts" -type f -exec grep -l "TODO:" {} \\;`,
        { encoding: 'utf-8', stdio: 'pipe' }
      )

      if (output.trim()) {
        foundTODOs = true
        todoFiles.push(...output.trim().split('\n'))
      }
    } catch (error) {
      // grep returns exit code 1 when no matches found (this is good)
      if ((error as any).status !== 1) {
        console.error('Error checking TODOs:', error)
      }
    }
  }

  if (foundTODOs) {
    return {
      passed: false,
      message: `❌ Found TODOs in production code:\n${todoFiles.map(f => `  - ${f}`).join('\n')}`,
      severity: 'error'
    }
  }

  return {
    passed: true,
    message: '✅ No TODOs in production code',
    severity: 'error'
  }
}

// ============================================================================
// GATE 2: No In-Memory Storage in Engines
// ============================================================================

function checkForInMemoryStorage(): VerificationResult {
  console.log('\n🔍 Gate 2: Checking for in-memory storage...')

  const engineFiles = [
    'packages/engines/identity-engine/core/src/identity.engine.ts',
    'packages/engines/charter-engine/core/src/charter.engine.ts',
    'packages/engines/paywall-engine/core/src/paywall.engine.ts',
    'packages/engines/config-engine/core/src/config.engine.ts',
    'packages/engines/notifications-engine/core/src/notifications.engine.ts'
  ]

  const inMemoryFiles: string[] = []

  for (const file of engineFiles) {
    const fullPath = path.join(process.cwd(), file)

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${file}`)
      continue
    }

    const content = fs.readFileSync(fullPath, 'utf-8')

    // Check for in-memory Map declarations
    if (content.includes('new Map<')) {
      inMemoryFiles.push(file)
    }
  }

  if (inMemoryFiles.length > 0) {
    return {
      passed: false,
      message: `❌ Found in-memory storage (Map<>) in engines:\n${inMemoryFiles.map(f => `  - ${f}`).join('\n')}\n\n  Use Supabase for persistence instead.`,
      severity: 'error'
    }
  }

  return {
    passed: true,
    message: '✅ No in-memory storage detected',
    severity: 'error'
  }
}

// ============================================================================
// GATE 3: Tests Actually Run
// ============================================================================

function checkTestsRun(): VerificationResult {
  console.log('\n🔍 Gate 3: Checking if tests actually run...')

  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  const testScript = packageJson.scripts?.test

  if (!testScript) {
    return {
      passed: false,
      message: '❌ No test script found in package.json',
      severity: 'error'
    }
  }

  // Check for fake test scripts
  const fakePatterns = [
    'echo "Tests coming soon"',
    'echo "Tests"',
    'exit 0',
    'true'
  ]

  for (const pattern of fakePatterns) {
    if (testScript.includes(pattern)) {
      return {
        passed: false,
        message: `❌ Test script is fake: "${testScript}"\n\n  Configure a real test runner (Vitest, Jest, etc.)`,
        severity: 'error'
      }
    }
  }

  // Try to run tests (with timeout)
  try {
    console.log('   Running tests...')
    execSync('npm test', {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 60000 // 1 minute timeout
    })

    return {
      passed: true,
      message: '✅ Tests run and pass',
      severity: 'error'
    }
  } catch (error) {
    return {
      passed: false,
      message: `❌ Tests failed to run:\n  ${(error as any).message}`,
      severity: 'error'
    }
  }
}

// ============================================================================
// GATE 4: README Claims Match Reality
// ============================================================================

function checkREADMEClaims(): VerificationResult {
  console.log('\n🔍 Gate 4: Checking README claims...')

  const readmePath = path.join(process.cwd(), 'README.md')

  if (!fs.existsSync(readmePath)) {
    return {
      passed: false,
      message: '❌ README.md not found',
      severity: 'warning'
    }
  }

  const readme = fs.readFileSync(readmePath, 'utf-8')

  const forbiddenClaims = [
    { pattern: /production[- ]ready/i, message: 'Claims "production ready"' },
    { pattern: /98%|99%|100%/i, message: 'Claims 98-100% complete' },
    { pattern: /fully implemented/i, message: 'Claims "fully implemented"' },
    { pattern: /complete.*implementation/i, message: 'Claims "complete implementation"' },
    { pattern: /enterprise[- ]grade/i, message: 'Claims "enterprise grade"' }
  ]

  const violations: string[] = []

  for (const claim of forbiddenClaims) {
    if (claim.pattern.test(readme)) {
      violations.push(claim.message)
    }
  }

  // Check for trademark symbols on internal components
  if (readme.includes('Engine™') || readme.includes('TruthSerum™')) {
    violations.push('Uses ™ symbols on internal components (remove branding theater)')
  }

  if (violations.length > 0) {
    return {
      passed: false,
      message: `❌ README contains inflated claims:\n${violations.map(v => `  - ${v}`).join('\n')}\n\n  Update README with honest status.`,
      severity: 'error'
    }
  }

  return {
    passed: true,
    message: '✅ README claims appear honest',
    severity: 'error'
  }
}

// ============================================================================
// GATE 5: War Room Doesn't Return Mock Data
// ============================================================================

function checkWarRoomMocks(): VerificationResult {
  console.log('\n🔍 Gate 5: Checking War Room for mock data...')

  const warRoomDatasourcePath = path.join(process.cwd(), 'packages/war-room/src/datasources/index.ts')

  if (!fs.existsSync(warRoomDatasourcePath)) {
    return {
      passed: true,
      message: '⚠️  War Room datasource file not found (skipping)',
      severity: 'warning'
    }
  }

  const content = fs.readFileSync(warRoomDatasourcePath, 'utf-8')

  const mockPatterns = [
    'return []',
    'return {}',
    'TODO: Implement',
    'console.warn',
    'mock data',
    'hardcoded'
  ]

  const foundMocks: string[] = []

  for (const pattern of mockPatterns) {
    if (content.includes(pattern)) {
      foundMocks.push(pattern)
    }
  }

  if (foundMocks.length > 0) {
    return {
      passed: false,
      message: `❌ War Room returns mock data:\n${foundMocks.map(m => `  - Found: "${m}"`).join('\n')}\n\n  Implement real ReceiptReader.`,
      severity: 'warning'
    }
  }

  return {
    passed: true,
    message: '✅ War Room uses real data sources',
    severity: 'warning'
  }
}

// ============================================================================
// GATE 6: Check for Self-Issued Certificates
// ============================================================================

function checkForSelfIssuedCerts(): VerificationResult {
  console.log('\n🔍 Gate 6: Checking for self-issued certificates...')

  const certPatterns = [
    'docs/*CERTIFICATE*.md',
    'docs/*CERT*.md',
    '**/*production*certificate*.md'
  ]

  let foundCerts = false
  const certFiles: string[] = []

  for (const pattern of certPatterns) {
    try {
      const output = execSync(
        `find docs -iname "*certificate*.md" -o -iname "*cert*.md" 2>/dev/null`,
        { encoding: 'utf-8', stdio: 'pipe' }
      )

      if (output.trim()) {
        foundCerts = true
        certFiles.push(...output.trim().split('\n'))
      }
    } catch (error) {
      // No matches found (this is good)
    }
  }

  if (foundCerts) {
    return {
      passed: false,
      message: `⚠️  Found self-issued certificates:\n${certFiles.map(f => `  - ${f}`).join('\n')}\n\n  Remove self-issued certificates. Use external verification instead.`,
      severity: 'warning'
    }
  }

  return {
    passed: true,
    message: '✅ No self-issued certificates found',
    severity: 'warning'
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('==================================================')
  console.log('🔒 CLAIM VERIFICATION SYSTEM')
  console.log('==================================================')
  console.log('Purpose: Prevent Documentation Theater')
  console.log('Author: Built after Jehad\'s D+ review')
  console.log('==================================================\n')

  // Run all verification gates
  results.push(checkForTODOs())
  results.push(checkForInMemoryStorage())
  results.push(checkTestsRun())
  results.push(checkREADMEClaims())
  results.push(checkWarRoomMocks())
  results.push(checkForSelfIssuedCerts())

  // Print results
  console.log('\n==================================================')
  console.log('📋 VERIFICATION RESULTS')
  console.log('==================================================\n')

  let errorCount = 0
  let warningCount = 0

  for (const result of results) {
    console.log(result.message)

    if (!result.passed) {
      if (result.severity === 'error') {
        errorCount++
      } else {
        warningCount++
      }
    }
  }

  console.log('\n==================================================')
  console.log('📊 SUMMARY')
  console.log('==================================================\n')
  console.log(`Total Checks: ${results.length}`)
  console.log(`Passed: ${results.filter(r => r.passed).length}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Warnings: ${warningCount}`)
  console.log('\n')

  if (errorCount > 0) {
    console.log('❌ VERIFICATION FAILED')
    console.log('\nYou cannot claim features as "complete" until all errors are fixed.')
    console.log('See VERIFICATION_FRAMEWORK.md for requirements.')
    process.exit(1)
  }

  if (warningCount > 0) {
    console.log('⚠️  VERIFICATION PASSED (with warnings)')
    console.log('\nWarnings should be addressed before production release.')
    process.exit(0)
  }

  console.log('✅ ALL VERIFICATIONS PASSED')
  console.log('\nYou can safely claim the implemented features are real.')
  process.exit(0)
}

main()
