import fs from 'fs';
import path from 'path';
import ActionGuard from '../packages/runtime/src/guard/ActionGuard';

async function ensureRegistry() {
  const repoRoot = path.resolve(__dirname, '..');
  const robby = path.join(repoRoot, '.robby');
  const registryDir = path.join(robby, 'REGISTRY');
  const registryFile = path.join(registryDir, 'actions.v1.json');
  if (!fs.existsSync(registryDir)) fs.mkdirSync(registryDir, { recursive: true });
  if (!fs.existsSync(registryFile)) {
    const payload = { actions: [{ action_id: 'test.action', requires_brainsmart: false, category: 'test' }] };
    fs.writeFileSync(registryFile, JSON.stringify(payload, null, 2));
  }
}

async function run() {
  await ensureRegistry();
  const guard = new ActionGuard();
  const r = await guard.guardAction({ action_id: 'test.action', sessionId: 's-e2e' });
  console.log('E2E guard result:', r);
}

run().catch((e) => { console.error(e); process.exit(1); });
