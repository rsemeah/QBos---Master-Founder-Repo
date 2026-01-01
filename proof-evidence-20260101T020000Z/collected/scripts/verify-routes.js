#!/usr/bin/env node
/**
 * Route Verification Script
 * 
 * Verifies that all routes in route-manifest.ts have corresponding page files.
 * Ensures no dead-end routes exist.
 * 
 * Constitutional Requirement: "Any route not in this manifest is considered Unknown."
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = 'packages/runtime/route-manifest.ts';
const PROOF_HARNESS_BASE = 'apps/proof-harness';

console.log('🔍 TruthGate: Verifying Route Manifest...\n');

// Read and parse route manifest
let manifestContent;
try {
  manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
} catch (error) {
  console.error(`❌ FAILED: Route manifest not found at ${MANIFEST_PATH}`);
  process.exit(1);
}

// Extract routes (simple parsing - in production would use TS compiler API)
const routeMatches = manifestContent.matchAll(/pageFile:\s*['"]([^'"]+)['"]/g);
const routes = Array.from(routeMatches, match => match[1]);

if (routes.length === 0) {
  console.error('❌ FAILED: No routes found in manifest');
  process.exit(1);
}

console.log(`Found ${routes.length} routes in manifest\n`);

let failedRoutes = [];
let passedRoutes = [];

for (const route of routes) {
  const fullPath = path.join(PROOF_HARNESS_BASE, route);
  
  if (fs.existsSync(fullPath)) {
    passedRoutes.push(route);
    console.log(`✅ ${route}`);
  } else {
    failedRoutes.push(route);
    console.error(`❌ ${route} — FILE MISSING`);
  }
}

console.log(`\n📊 Results:`);
console.log(`  ✅ Passed: ${passedRoutes.length}`);
console.log(`  ❌ Failed: ${failedRoutes.length}`);

if (failedRoutes.length > 0) {
  console.error(`\n❌ TRUTHGATE FAILED: ${failedRoutes.length} route(s) missing page files`);
  console.error('\nMissing routes:');
  failedRoutes.forEach(route => console.error(`  - ${route}`));
  process.exit(1);
}

console.log('\n✅ TRUTHGATE PASSED: All routes have corresponding page files');
process.exit(0);
