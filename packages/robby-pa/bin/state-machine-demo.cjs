#!/usr/bin/env node
// Simple demo of valid/invalid transitions
const { inspect } = require('util');

const VALID_TRANSITIONS = {
  'INTENT.collecting': ['INTENT.refining'],
  'INTENT.refining': ['INTENT.confirming'],
  'INTENT.confirming': ['INTENT.locked', 'INTENT.refining'],
  'INTENT.locked': ['EXECUTION.queued'],

  'EXECUTION.queued': ['EXECUTION.running'],
  'EXECUTION.running': ['EXECUTION.blocked', 'EXECUTION.completed'],
  'EXECUTION.blocked': ['INTENT.refining', 'VERDICT.ready'],
  'EXECUTION.pivoting': ['EXECUTION.running', 'EXECUTION.blocked'],
  'EXECUTION.completed': ['VERDICT.analyzing'],

  'VERDICT.analyzing': ['VERDICT.ready'],
  'VERDICT.ready': ['VERDICT.accepted', 'VERDICT.rejected'],
  'VERDICT.rejected': ['INTENT.collecting'],
  'VERDICT.accepted': []
};

function isValidTransition(fromPhase, fromState, toPhase, toState) {
  const fromKey = `${fromPhase}.${fromState}`;
  const toKey = `${toPhase}.${toState}`;
  const allowed = VALID_TRANSITIONS[fromKey] || [];
  return allowed.includes(toKey);
}

function run() {
  const cases = [
    { from: ['INTENT', 'collecting'], to: ['INTENT', 'refining'], expect: true },
    { from: ['INTENT', 'confirming'], to: ['INTENT', 'locked'], expect: true },
    { from: ['INTENT', 'locked'], to: ['EXECUTION', 'queued'], expect: true },
    { from: ['EXECUTION', 'running'], to: ['VERDICT', 'ready'], expect: false },
    { from: ['EXECUTION', 'running'], to: ['EXECUTION', 'completed'], expect: true },
    { from: ['VERDICT', 'accepted'], to: ['INTENT', 'collecting'], expect: false }
  ];

  for (const c of cases) {
    const ok = isValidTransition(c.from[0], c.from[1], c.to[0], c.to[1]);
    console.log(`${c.from[0]}.${c.from[1]} -> ${c.to[0]}.${c.to[1]}  expected=${c.expect}  result=${ok}`);
  }
}

run();
