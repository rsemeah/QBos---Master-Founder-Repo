#!/usr/bin/env node
"use strict";
/**
 * TruthGate - Enforces truth-based standards in the repo
 * Fails if:
 * 1. Forbidden claim words appear without TruthSerum guards
 * 2. Required proof files are missing
 * 3. Canonical flow test fails
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
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
function main() {
    console.log('🧪 Running TruthGate checks...\n');
    const result = {
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
    }
    else {
        console.log('   ✅ No forbidden claims found\n');
    }
    // Check 2: Verify required proof files exist
    console.log('2️⃣  Checking required proof files...');
    const proofIssues = checkRequiredProofFiles();
    if (proofIssues.length > 0) {
        result.passed = false;
        result.errors.push(...proofIssues);
    }
    else {
        console.log('   ✅ All required proof files exist\n');
    }
    // Check 3: Run canonical flow test
    console.log('3️⃣  Running canonical flow test...');
    const flowResult = runCanonicalFlow();
    if (!flowResult.success) {
        result.passed = false;
        result.errors.push(flowResult.error);
    }
    else {
        console.log('   ✅ Canonical flow passed\n');
    }
    // Print results
    console.log('\n' + '='.repeat(60));
    if (result.passed) {
        console.log('✅ TruthGate PASSED');
        console.log('='.repeat(60));
        process.exit(0);
    }
    else {
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
function scanForForbiddenClaims() {
    const issues = [];
    SCAN_DIRS.forEach(dir => {
        const fullPath = path.join(REPO_ROOT, dir);
        if (!fs.existsSync(fullPath))
            return;
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
function getAllFiles(dirPath, extensions) {
    const files = [];
    function traverse(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                // Skip node_modules, .git, dist, etc.
                if (!['node_modules', '.git', 'dist', '.next', 'build'].includes(entry.name)) {
                    traverse(fullPath);
                }
            }
            else if (entry.isFile()) {
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
function checkRequiredProofFiles() {
    const issues = [];
    REQUIRED_PROOF_FILES.forEach(filePath => {
        const fullPath = path.join(REPO_ROOT, filePath);
        if (!fs.existsSync(fullPath)) {
            issues.push(`Required proof file missing: ${filePath}`);
        }
    });
    return issues;
}
function runCanonicalFlow() {
    try {
        const scriptPath = path.join(REPO_ROOT, 'test-canonical-flow.sh');
        if (!fs.existsSync(scriptPath)) {
            return {
                success: false,
                error: 'Canonical flow script not found: test-canonical-flow.sh',
            };
        }
        (0, child_process_1.execSync)(`bash ${scriptPath}`, {
            cwd: REPO_ROOT,
            stdio: 'inherit',
        });
        return { success: true };
    }
    catch (error) {
        return {
            success: false,
            error: `Canonical flow test failed: ${error}`,
        };
    }
}
main();
//# sourceMappingURL=truthgate.js.map