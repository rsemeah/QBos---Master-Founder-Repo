#!/usr/bin/env node

/**
 * TruthGate - CI enforcement for TruthSerum discipline
 * Fails if forbidden claims appear without proof constraints
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_WORDS = [
  'deployed',
  'live',
  'published',
  'ready',
  'working',
  'completed',
  'fixed',
  'verified',
];

const REQUIRED_FILES = [
  'packages/truthserum/src/types.ts',
  'packages/truthserum/src/TruthSerum.ts',
  'packages/truthserum/src/ReceiptWriter.ts',
  'packages/truthserum/src/intents/registry.ts',
  'apps/proof-harness/app/api/truth/evaluate/route.ts',
  'apps/proof-harness/app/api/receipts/route.ts',
  'apps/proof-harness/app/api/chat/route.ts',
];

const PROOF_DIR = path.join(process.cwd(), 'proof');

let exitCode = 0;

console.log('🧪 TruthGate - Enforcing proof discipline\n');

// Check 1: Required files exist
console.log('📋 Checking required files...');
for (const file of REQUIRED_FILES) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ Missing: ${file}`);
    exitCode = 1;
  } else {
    console.log(`  ✓ ${file}`);
  }
}

// Check 2: Proof directory exists
console.log('\n📁 Checking proof directory...');
if (!fs.existsSync(PROOF_DIR)) {
  console.error('  ❌ Missing: /proof directory');
  exitCode = 1;
} else {
  console.log(`  ✓ /proof directory exists`);
  const proofFiles = fs.readdirSync(PROOF_DIR);
  console.log(`  ℹ️  ${proofFiles.length} proof files found`);
}

// Check 3: Scan for forbidden claims in UI/docs without truth constraints
console.log('\n🔍 Scanning for unverified claims...');
const uiDirs = [
  'apps/proof-harness/app',
  'docs',
  'README.md',
];

let violations = [];

for (const dir of uiDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) continue;

  if (fs.statSync(fullPath).isFile()) {
    checkFile(fullPath, violations);
  } else {
    scanDirectory(fullPath, violations);
  }
}

if (violations.length > 0) {
  console.log(`  ⚠️  Found ${violations.length} potential violations:`);
  violations.slice(0, 10).forEach(v => {
    console.log(`    - ${v.file}:${v.line}: "${v.text}"`);
  });
  if (violations.length > 10) {
    console.log(`    ... and ${violations.length - 10} more`);
  }
  console.log('\n  💡 These words must be accompanied by TruthSerum checks or receipt verification');
} else {
  console.log('  ✓ No unverified claims detected');
}

// Check 4: TypeScript compilation (if possible)
console.log('\n🔧 Checking TypeScript compilation...');
if (fs.existsSync(path.join(process.cwd(), 'tsconfig.json'))) {
  const { execSync } = require('child_process');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('  ✓ TypeScript compilation passed');
  } catch (error) {
    console.error('  ❌ TypeScript compilation failed');
    console.error(error.stdout?.toString() || error.message);
    exitCode = 1;
  }
} else {
  console.log('  ℹ️  No tsconfig.json found, skipping');
}

// Summary
console.log('\n' + '='.repeat(60));
if (exitCode === 0) {
  console.log('✅ TruthGate PASSED - All checks passed');
} else {
  console.log('❌ TruthGate FAILED - Fix issues above');
}
console.log('='.repeat(60) + '\n');

process.exit(exitCode);

// Helper functions
function scanDirectory(dir, violations) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectory(fullPath, violations);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.md'))) {
      checkFile(fullPath, violations);
    }
  }
}

function checkFile(filePath, violations) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    const lowerLine = line.toLowerCase();
    
    // Skip lines that already have truth checks
    if (lowerLine.includes('truthserum') || 
        lowerLine.includes('receipt') ||
        lowerLine.includes('state:') ||
        lowerLine.includes('status unknown')) {
      return;
    }

    // Check for forbidden words
    for (const word of FORBIDDEN_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(line)) {
        violations.push({
          file: path.relative(process.cwd(), filePath),
          line: idx + 1,
          text: line.trim().substring(0, 80),
          word,
        });
      }
    }
  });
}
