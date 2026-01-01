#!/usr/bin/env node
/**
 * Receipt Validation Script
 * 
 * Validates that receipt system implementation meets constitutional requirements:
 * - Required attributes enforced
 * - Parent-child chaining possible
 * - Truth states properly typed
 * 
 * Constitutional Requirement: "Every meaningful action must emit a receipt"
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TruthGate: Validating Receipt System...\n');

const RECEIPT_SYSTEM_PATH = 'packages/engines/execution-engine/core/src/receipts/ReceiptSystem.ts';
const TRUTHSERUM_PATH = 'packages/engines/execution-engine/core/src/receipts/TruthSerumValidator.ts';

// Check ReceiptSystem exists
if (!fs.existsSync(RECEIPT_SYSTEM_PATH)) {
  console.error(`❌ FAILED: ReceiptSystem not found at ${RECEIPT_SYSTEM_PATH}`);
  process.exit(1);
}

// Check TruthSerumValidator exists
if (!fs.existsSync(TRUTHSERUM_PATH)) {
  console.error(`❌ FAILED: TruthSerumValidator not found at ${TRUTHSERUM_PATH}`);
  process.exit(1);
}

const receiptContent = fs.readFileSync(RECEIPT_SYSTEM_PATH, 'utf8');
const truthserumContent = fs.readFileSync(TRUTHSERUM_PATH, 'utf8');

// Required Receipt interface fields
const requiredFields = [
  'receipt_id',
  'session_id',
  'timestamp',
  'actor',
  'action_type',
  'outcome',
  'evidence_refs',
  'truth_state',
];

console.log('Checking Receipt interface has required fields...\n');

let missingFields = [];
for (const field of requiredFields) {
  if (!receiptContent.includes(field)) {
    missingFields.push(field);
    console.error(`❌ Missing required field: ${field}`);
  } else {
    console.log(`✅ ${field}`);
  }
}

if (missingFields.length > 0) {
  console.error(`\n❌ FAILED: ${missingFields.length} required field(s) missing`);
  process.exit(1);
}

// Check for truth states
console.log('\n Checking TruthState types...\n');
const hasTruthStates = receiptContent.includes('Verified') && receiptContent.includes('Unknown');
if (!hasTruthStates) {
  console.error('❌ FAILED: TruthState type missing Verified/Unknown');
  process.exit(1);
}
console.log('✅ TruthState: Verified | Unknown');

// Check for outcome types
console.log('\nChecking ReceiptOutcome types...\n');
const requiredOutcomes = ['success', 'blocked', 'error', 'unknown'];
let missingOutcomes = [];
for (const outcome of requiredOutcomes) {
  if (!receiptContent.includes(`'${outcome}'`) && !receiptContent.includes(`"${outcome}"`)) {
    missingOutcomes.push(outcome);
  } else {
    console.log(`✅ ${outcome}`);
  }
}

if (missingOutcomes.length > 0) {
  console.error(`\n❌ FAILED: Missing outcome types: ${missingOutcomes.join(', ')}`);
  process.exit(1);
}

// Check TruthSerum validator has required methods
console.log('\nChecking TruthSerumValidator methods...\n');
const requiredMethods = ['validate', 'TruthSerumReport'];
let missingMethods = [];
for (const method of requiredMethods) {
  if (!truthserumContent.includes(method)) {
    missingMethods.push(method);
    console.error(`❌ Missing: ${method}`);
  } else {
    console.log(`✅ ${method}`);
  }
}

if (missingMethods.length > 0) {
  console.error(`\n❌ FAILED: ${missingMethods.length} required method(s) missing`);
  process.exit(1);
}

// Check for parent receipt chaining
console.log('\nChecking parent receipt chaining...\n');
const hasParentChain = receiptContent.includes('parent_receipt_id');
if (!hasParentChain) {
  console.error('❌ FAILED: parent_receipt_id field missing (required for causal chains)');
  process.exit(1);
}
console.log('✅ parent_receipt_id field present');

console.log('\n✅ TRUTHGATE PASSED: Receipt system meets constitutional requirements');
process.exit(0);
