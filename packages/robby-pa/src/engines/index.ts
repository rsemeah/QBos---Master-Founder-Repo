import { EngineAdapter, EngineResult } from './adapter';

// Try to import real engines (best-effort). If unavailable, provide deterministic stubs.
function tryRequire(path: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path);
  } catch (e) {
    return null;
  }
}

const adapters: Record<string, EngineAdapter> = {};

// Example: SilentEngine
const SilentEngine = tryRequire('@qbos/engines-silent')?.default || null;
if (SilentEngine) {
  adapters['SilentEngine'] = SilentEngine;
} else {
  adapters['SilentEngine'] = {
    name: 'SilentEngine.stub',
    async invoke(params: any): Promise<EngineResult> {
      // Deterministic stub: returns a small artifact
      const content = `silent-engine-output:${JSON.stringify(params).slice(0, 200)}`;
      const sha = require('crypto').createHash('sha256').update(content).digest('hex');
      const uri = `local://silent/${Date.now()}.txt`;
      return { success: true, stdout: content, artifacts: [{ uri, sha256: sha, contentType: 'text/plain' }] };
    }
  };
}

// Provide other engine stubs (Identity, Execution, Config, Paywall, Notifications, Sight, Silent already)
const names = ['ExecutionEngine', 'IdentityEngine', 'CharterEngine', 'ConfigEngine', 'PaywallEngine', 'NotificationsEngine', 'SightEngine'];
for (const n of names) {
  if (!adapters[n]) {
    adapters[n] = {
      name: `${n}.stub`,
      async invoke(params: any): Promise<EngineResult> {
        const content = `${n}-stub-output:${JSON.stringify(params).slice(0, 200)}`;
        const sha = require('crypto').createHash('sha256').update(content).digest('hex');
        const uri = `local://${n.toLowerCase()}/${Date.now()}.txt`;
        return { success: true, stdout: content, artifacts: [{ uri, sha256: sha, contentType: 'text/plain' }] };
      }
    };
  }
}

export function getAdapter(name: string): EngineAdapter {
  return adapters[name] || adapters['SilentEngine'];
}

export default adapters;
