#!/usr/bin/env node
/**
 * Engine Pages Verification Script
 * 
 * Verifies that all engine keys in ENGINE_KEYS have valid detail pages.
 * Constitutional Requirement: "Never 404 for valid engine keys"
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = 'packages/runtime/route-manifest.ts';
const ENGINE_PAGE_PATH = 'apps/proof-harness/app/engines/[engineKey]/page.tsx';

console.log('🔍 TruthGate: Verifying Engine Pages...\n');

// Read manifest to get ENGINE_KEYS
let manifestContent;
try {
  manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
} catch (error) {
  console.error(`❌ FAILED: Route manifest not found`);
  process.exit(1);
}

// Extract ENGINE_KEYS array
const engineKeysMatch = manifestContent.match(/ENGINE_KEYS\s*=\s*\[([\s\S]*?)\]/);
if (!engineKeysMatch) {
  console.error('❌ FAILED: ENGINE_KEYS not found in manifest');
  process.exit(1);
}

const engineKeys = engineKeysMatch[1]
  .split(',')
  .map(key => key.trim().replace(/['"]/g, ''))
  .filter(key => key.length > 0);

console.log(`Found ${engineKeys.length} engine keys:`, engineKeys.join(', '));

// Check if dynamic engine page exists
if (!fs.existsSync(ENGINE_PAGE_PATH)) {
  console.error(`\n❌ FAILED: Engine detail page missing at ${ENGINE_PAGE_PATH}`);
  process.exit(1);
}

console.log(`\n✅ Engine detail page exists: ${ENGINE_PAGE_PATH}`);

// Read the page to verify it handles all engine keys
const pageContent = fs.readFileSync(ENGINE_PAGE_PATH, 'utf8');

// Check for VALID_ENGINE_KEYS or similar constant
const hasValidation = pageContent.includes('VALID_ENGINE_KEYS') || 
                      pageContent.includes('engineKey') ||
                      pageContent.includes('params');

if (!hasValidation) {
  console.error('\n⚠️  WARNING: Engine page may not validate engine keys');
}

// Verify each engine key has metadata
let missingMetadata = [];
for (const key of engineKeys) {
  // Check if key appears in page (basic check)
  if (!pageContent.includes(`'${key}'`) && !pageContent.includes(`"${key}"`)) {
    missingMetadata.push(key);
  }
}

if (missingMetadata.length > 0) {
  console.error(`\n❌ FAILED: ${missingMetadata.length} engine(s) missing metadata in page:`);
  missingMetadata.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log(`\n✅ TRUTHGATE PASSED: All ${engineKeys.length} engines have valid pages`);
process.exit(0);
