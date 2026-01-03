#!/usr/bin/env ts-node

async function run() {
  const mod = await import('../src/core/sessionManager.ts');
  const SessionManager = mod.SessionManager;
  const m = new SessionManager();
  const s = m.createSession('Create authenticated user session');
  console.log('created session:', s.id, s.state);

  // submit intent
  m.submitIntent(s.id, {
    goal: 'Create authenticated user session',
    successCriteria: ['User identity verified'],
    scope: { in: ['Authentication'], out: [] },
    constraints: [],
    unknowns: [],
    engines: ['IdentityEngine'],
  });

  console.log('after submitIntent status:', m.getStatus(s.id));

  // Attempt execute without approving intent - should block
  const exec = await m.execute(s.id);
  console.log('execute attempt result:', exec);
  console.log('status after blocked execute:', m.getStatus(s.id));

  // Now approve intent
  await m.approveIntent(s.id, true);
  console.log('status after approve:', m.getStatus(s.id));

  // Execute again - should proceed
  const exec2 = await m.execute(s.id);
  console.log('execute after approval:', exec2);
  console.log('final status:', m.getStatus(s.id));
}

run().catch(e => { console.error(e); process.exit(1); });
