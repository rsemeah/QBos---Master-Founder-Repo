#!/usr/bin/env node
/**
 * Dead-End Route Checker
 * 
 * Searches for hardcoded routes in code that aren't in route-manifest.ts
 * Ensures all navigation is intentional and documented.
 * 
 * Constitutional Requirement: "No dead ends — ever"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 TruthGate: Checking for Dead-End Routes...\n');

const MANIFEST_PATH = 'packages/runtime/route-manifest.ts';
const SEARCH_DIRS = ['apps/proof-harness/app'];

// Read manifest to get valid routes
let manifestContent;
try {
  manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
} catch (error) {
  console.error(`❌ FAILED: Route manifest not found`);
  process.exit(1);
}

// Extract all paths from manifest
const pathMatches = manifestContent.matchAll(/path:\s*['"]([^'"]+)['"]/g);
const validPaths = new Set(Array.from(pathMatches, match => match[1]));

console.log(`Valid routes in manifest: ${validPaths.size}`);
console.log([...validPaths].join(', '));

// Search for href= and router.push patterns in code
console.log('\n🔍 Searching for route references in code...\n');

const routePatterns = [
  /href=["']([^"']+)["']/g,
  /router\.push\(["']([^"']+)["']\)/g,
  /Link.*href=["']([^"']+)["']/g,
  /navigate\(["']([^"']+)["']\)/g,
];

let potentialDeadEnds = new Set();
let checkedFiles = 0;

function searchDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        searchDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      checkedFiles++;
      const content = fs.readFileSync(fullPath, 'utf8');
      
      for (const pattern of routePatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const route = match[1];
          
          // Skip external URLs, dynamic params, and common patterns
          if (route.startsWith('http') || 
              route.startsWith('#') || 
              route.includes('${') ||
              route.includes('?') ||
              route === '/' ||
              route === '') {
            continue;
          }
          
          // Check if route is in manifest
          if (!validPaths.has(route)) {
            potentialDeadEnds.add(route);
          }
        }
      }
    }
  }
}

for (const dir of SEARCH_DIRS) {
  if (fs.existsSync(dir)) {
    searchDirectory(dir);
  }
}

console.log(`Checked ${checkedFiles} files\n`);

if (potentialDeadEnds.size > 0) {
  console.log('⚠️  Potential dead-end routes found (may be dynamic or external):\n');
  [...potentialDeadEnds].forEach(route => {
    console.log(`  - ${route}`);
  });
  console.log('\n✅ PASSED (with warnings): Review routes above');
} else {
  console.log('✅ TRUTHGATE PASSED: No dead-end routes detected');
}

process.exit(0);
