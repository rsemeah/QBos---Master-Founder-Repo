import { EngineAdapter, EngineResult } from "./adapter";

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

// Best-effort: attempt to locate runtime guard `guardAction`.
function tryLoadGuard() {
  try {
    // Try the source path first (dev), then built dist path.
    // Resolve at runtime to avoid compile-time hard dependency.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const g = require("../../../runtime/src");
    if (g && typeof g.guardAction === "function") return g.guardAction;
  } catch (e) {
    // ignore
  }
  try {
    // built distribution (if present)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const g2 = require("../../../runtime/dist");
    if (g2 && typeof g2.guardAction === "function") return g2.guardAction;
  } catch (e) {
    // ignore
  }
  return null;
}

const _guardAction = tryLoadGuard();

function wrapAdapterWithGuard(
  name: string,
  adapter: EngineAdapter,
): EngineAdapter {
  if (!_guardAction) return adapter;
  return {
    ...adapter,
    async invoke(params: any): Promise<EngineResult> {
      try {
        // Call guardAction prior to invocation. If denied, guardAction should return {allowed:false}
        const q = {
          action_id: `engine.invoke:${name}`,
          category: "engine",
          scope: name,
          sessionId: params && params.sessionId ? params.sessionId : null,
          runId: params && params.runId ? params.runId : null,
          metadata: { engine: name, params },
        } as any;
        const res = await _guardAction(q);
        if (!res || !res.allowed) {
          throw new Error(`guard_denied:${res?.reason || "unknown"}`);
        }
      } catch (e) {
        // If guard errors, treat as denial to be conservative.
        throw e;
      }
      return adapter.invoke(params);
    },
  } as EngineAdapter;
}

// Example: SilentEngine
const SilentEngine = tryRequire("@qbos/engines-silent")?.default || null;
if (SilentEngine) {
  adapters["SilentEngine"] = wrapAdapterWithGuard("SilentEngine", SilentEngine);
} else {
  adapters["SilentEngine"] = {
    name: "SilentEngine.stub",
    async invoke(params: any): Promise<EngineResult> {
      // Deterministic stub: returns a small artifact
      const content = `silent-engine-output:${JSON.stringify(params).slice(0, 200)}`;
      const sha = require("crypto")
        .createHash("sha256")
        .update(content)
        .digest("hex");
      const uri = `local://silent/${Date.now()}.txt`;
      return {
        success: true,
        stdout: content,
        artifacts: [{ uri, sha256: sha, contentType: "text/plain" }],
      };
    },
  };
}

// Provide other engine stubs (Identity, Execution, Config, Paywall, Notifications, Sight, Silent already)
const names = [
  "ExecutionEngine",
  "IdentityEngine",
  "CharterEngine",
  "ConfigEngine",
  "PaywallEngine",
  "NotificationsEngine",
  "SightEngine",
];
for (const n of names) {
  if (!adapters[n]) {
    adapters[n] = wrapAdapterWithGuard(n, {
      name: `${n}.stub`,
      async invoke(params: any): Promise<EngineResult> {
        const content = `${n}-stub-output:${JSON.stringify(params).slice(0, 200)}`;
        const sha = require("crypto")
          .createHash("sha256")
          .update(content)
          .digest("hex");
        const uri = `local://${n.toLowerCase()}/${Date.now()}.txt`;
        return {
          success: true,
          stdout: content,
          artifacts: [{ uri, sha256: sha, contentType: "text/plain" }],
        };
      },
    });
  }
}

export function getAdapter(name: string): EngineAdapter {
  return adapters[name] || adapters["SilentEngine"];
}

export default adapters;
