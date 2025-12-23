#!/usr/bin/env node
/**
 * TruthGate - Enforces truth-based standards in the repo
 * Fails if:
 * 1. Forbidden claim words appear without TruthSerum guards
 * 2. Required proof files are missing
 * 3. Canonical flow test fails
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPO_ROOT = process.cwd();
const FORBIDDEN_CLAIMS = [
  'deployed',
  'live in production',
  'fully tested',
  'production ready',
  'verified to work',
  'completely implemented',
];

// Directories to scan for forbidden claims
const SCAN_DIRS = [
  'apps',
  'packages',
  'docs',
  'README.md',
];

// Required proof files
const REQUIRED_PROOF_FILES = [
  'proof/00_env.txt',
  'proof/01_workspace.txt',
  'proof/02_baseline_build.txt',
];

interface TruthGateResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function main() {
  console.log('🧪 Running TruthGate checks...\n');

  const result: TruthGateResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  // Check 1: Scan for forbidden claims
  console.log('1️⃣  Scanning for forbidden claims without truth guards...');
  const claimIssues = scanForForbiddenClaims();
  if (claimIssues.length > 0) {
    result.passed = false;
    result.errors.push(...claimIssues);
  } else {
    console.log('   ✅ No forbidden claims found\n');
  }

  // Check 2: Verify required proof files exist
  console.log('2️⃣  Checking required proof files...');
  const proofIssues = checkRequiredProofFiles();
  if (proofIssues.length > 0) {
    result.passed = false;
    result.errors.push(...proofIssues);
  } else {
    console.log('   ✅ All required proof files exist\n');
  }

  // Check 3: Run canonical flow test
  console.log('3️⃣  Running canonical flow test...');
  const flowResult = runCanonicalFlow();
  if (!flowResult.success) {
    result.passed = false;
    result.errors.push(flowResult.error!);
  } else {
    console.log('   ✅ Canonical flow passed\n');
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  if (result.passed) {
    console.log('✅ TruthGate PASSED');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ TruthGate FAILED');
    console.log('='.repeat(60));
    console.log('\nErrors:');
    result.errors.forEach((err, idx) => {
      console.log(`${idx + 1}. ${err}`);
    });
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach((warn, idx) => {
        console.log(`${idx + 1}. ${warn}`);
      });
    }
    process.exit(1);
  }
}

function scanForForbiddenClaims(): string[] {
  const issues: string[] = [];

  SCAN_DIRS.forEach(dir => {
    const fullPath = path.join(REPO_ROOT, dir);
    if (!fs.existsSync(fullPath)) return;

    const files = getAllFiles(fullPath, ['.ts', '.tsx', '.js', '.jsx', '.md']);
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      FORBIDDEN_CLAIMS.forEach(claim => {
        const regex = new RegExp(claim, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          // Check if it's guarded by TruthSerum context
          const hasTruthGuard = content.includes('TruthSerum') || 
                                 content.includes('Unknown') ||
                                 content.includes('receipts') ||
                                 content.includes('proof required');
          
          if (!hasTruthGuard) {
            const relativePath = path.relative(REPO_ROOT, file);
            issues.push(`Forbidden claim "${claim}" in ${relativePath} without truth guard`);
          }
        }
      });
    });
  });

  return issues;
}

function getAllFiles(dirPath: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, dist, etc.
        if (!['node_modules', '.git', 'dist', '.next', 'build'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dirPath);
  return files;
}

function checkRequiredProofFiles(): string[] {
  const issues: string[] = [];
  
  REQUIRED_PROOF_FILES.forEach(filePath => {
    const fullPath = path.join(REPO_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      issues.push(`Required proof file missing: ${filePath}`);
    }
  });
  
  return issues;
}

function runCanonicalFlow(): { success: boolean; error?: string } {
  try {
    const scriptPath = path.join(REPO_ROOT, 'test-canonical-flow.sh');
    
    if (!fs.existsSync(scriptPath)) {
      return {
        success: false,
        error: 'Canonical flow script not found: test-canonical-flow.sh',
      };
    }

    execSync(`bash ${scriptPath}`, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Canonical flow test failed: ${error}`,
    };
  }
}

main();
