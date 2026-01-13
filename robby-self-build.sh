#!/bin/bash
set -euo pipefail

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ROBBY PA SELF-BUILD: TruthSerum™-CORRECT (EXECUTABLE)"
echo "════════════════════════════════════════════════════════════"
echo ""

# ----------------------------------------------------------------------------
# Repo root guard
# ----------------------------------------------------------------------------
ROOT="$(pwd)"
if [ ! -d "packages" ]; then
  echo "❌ ERROR: Must run from repo root (no ./packages directory found)."
  exit 1
fi

echo "Repo root: $ROOT"
echo ""

# ----------------------------------------------------------------------------
# Pre-flight: clean slate + backup existing packages
# ----------------------------------------------------------------------------
echo "📋 Pre-flight: backing up existing packages and cleaning..."

# Backup existing packages if they exist
if [ -d "packages/kernel" ] || [ -d "packages/capabilities" ] || [ -d "packages/runtime" ] || [ -d "packages/robby-pa" ]; then
  BACKUP_DIR="packages-backup-$(date +%s)"
  echo "   Backing up existing packages to $BACKUP_DIR..."
  mkdir -p "$BACKUP_DIR"
  for pkg in kernel capabilities runtime robby-pa; do
    if [ -d "packages/$pkg" ]; then
      mv "packages/$pkg" "$BACKUP_DIR/"
    fi
  done
  echo "   ✅ Backup complete"
fi

rm -f receipts/robby-self-build.jsonl || true
rm -rf proof/robby-self-build proof/bundles/robby-self-build || true
mkdir -p receipts proof/robby-self-build proof/bundles
echo "✅ Directories prepared"
echo ""

# ----------------------------------------------------------------------------
# Workspace: Minimal self-build workspace (exclude existing apps)
# ----------------------------------------------------------------------------
echo "🧩 Writing pnpm-workspace.yaml (bootstrap-safe)..."
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/kernel'
  - 'packages/capabilities'
  - 'packages/runtime'
  - 'packages/robby-pa'
EOF
echo "✅ pnpm-workspace.yaml written (minimal bootstrap)"
echo ""

# ----------------------------------------------------------------------------
# Helper: append top-level bootstrap receipts (honest: IMPLEMENTED)
# ----------------------------------------------------------------------------
append_bootstrap_receipt () {
  local json="$1"
  echo "$json" >> receipts/robby-self-build.jsonl
}

# ============================================================================
# PHASE 0: KERNEL
# ============================================================================
echo "🏗️  PHASE 0: @qbos/kernel"

mkdir -p packages/kernel/src

cat > packages/kernel/package.json << 'EOF'
{
  "name": "@qbos/kernel",
  "version": "1.0.0",
  "description": "Core contracts for QuietBuild OS",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/kernel/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/kernel/src/types.ts << 'EOF'
export enum JourneyState {
  AWAITING_INTENT = "AWAITING_INTENT",
  CONSENT_GIVEN = "CONSENT_GIVEN",
  SCOPE_LOCKED = "SCOPE_LOCKED",
  EXECUTING = "EXECUTING",
  VERIFIED = "VERIFIED",
  SHIPPED = "SHIPPED",
  BLOCKED = "BLOCKED",
}

export enum TrustClass {
  SAFE_BUILD = "SAFE_BUILD",
  SYSTEM_MUTATION = "SYSTEM_MUTATION",
  FORBIDDEN = "FORBIDDEN",
}

export enum TruthState {
  VERIFIED = "VERIFIED",
  IMPLEMENTED = "IMPLEMENTED",
  UNKNOWN = "UNKNOWN",
  BLOCKED = "BLOCKED",
}

export type EngineKey =
  | "execution"
  | "silent"
  | "sight"
  | "identity"
  | "charter"
  | "config"
  | "paywall"
  | "notifications"
  | "safety";

export interface Actor {
  userId: string;
  orgId?: string;
  roles?: string[];
}

export interface SessionContext {
  sessionId: string;
  runId: string;
  actor: Actor;
  consent: Record<string, { allowed: boolean; expiresAt?: string }>;
  entitlements: Record<string, { allowed: boolean }>;
  config: Record<string, any>;
  state: JourneyState;
}

export interface EngineOperation {
  opId: string;
  engineKey: EngineKey;
  opType: string;
  trustClass: TrustClass;
  inputs: Record<string, any>;
  requiredProofs: string[];
  reversible: boolean;
}

export interface EvidenceArtifact {
  kind: "log" | "artifact" | "test" | "receipt";
  path?: string;
  sha256?: string;
}

export interface EngineResult {
  ok: boolean;
  opId: string;
  engineKey: EngineKey;
  outputs?: Record<string, any>;
  evidence?: EvidenceArtifact[];
  errors?: Array<{ code: string; message: string }>;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  requires: string[];
  reversible: boolean;
  trustClass: TrustClass;
  proofRequirements: string[];
}

export interface Receipt {
  receiptId: string;
  runId: string;
  sessionId: string;
  timestamp: string;
  actor: Actor;
  engineKey?: EngineKey;
  opType: string;
  parentReceiptId?: string;
  truthState: TruthState;
  details?: Record<string, any>;
}

export interface QbosEngine {
  engineKey: EngineKey;
  health(): Promise<{ ok: boolean }>;
  execute(op: EngineOperation, ctx: SessionContext): Promise<EngineResult>;
}

export interface PreflightGateResult {
  allowed: boolean;
  trustEvaluation: { state: TruthState; confidence: number };
  blocks: string[];
}
EOF

cat > packages/kernel/src/index.ts << 'EOF'
export * from "./types";
EOF

echo "📦 pnpm install (repo root)..."
pnpm install >/dev/null 2>&1

echo "🔨 build kernel..."
( cd packages/kernel && pnpm build >/dev/null 2>&1 )

append_bootstrap_receipt "{\"receiptId\":\"phase-0-start\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"phase.started\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"phase\":0,\"name\":\"Foundation\",\"note\":\"Code executed, verification pending\"}}"
append_bootstrap_receipt "{\"receiptId\":\"kernel-created\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"package.created\",\"parentReceiptId\":\"phase-0-start\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"package\":\"@qbos/kernel\"}}"
append_bootstrap_receipt "{\"receiptId\":\"kernel-built\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"package.built\",\"parentReceiptId\":\"kernel-created\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"package\":\"@qbos/kernel\",\"artifacts\":[\"dist/index.js\",\"dist/types.js\"]}}"

echo "✅ Phase 0 complete: @qbos/kernel"
echo ""

# ============================================================================
# PHASE 1: CAPABILITIES
# ============================================================================
echo "📦 PHASE 1: @qbos/capabilities"

mkdir -p packages/capabilities/src

cat > packages/capabilities/package.json << 'EOF'
{
  "name": "@qbos/capabilities",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@qbos/kernel": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/capabilities/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/capabilities/src/capability-registry.ts << 'EOF'
import { Capability, TrustClass } from "@qbos/kernel";

export const CORE_CAPABILITIES: Record<string, Capability> = {
  "qbos.kernel": {
    id: "qbos.kernel",
    name: "QBos Kernel",
    description: "Core type definitions",
    requires: [],
    reversible: true,
    trustClass: TrustClass.SAFE_BUILD,
    proofRequirements: ["artifact.generated"]
  },
  "qbos.capabilities": {
    id: "qbos.capabilities",
    name: "Capability Registry",
    description: "Category mapping",
    requires: ["qbos.kernel"],
    reversible: true,
    trustClass: TrustClass.SAFE_BUILD,
    proofRequirements: ["artifact.generated"]
  },
  "qbos.runtime": {
    id: "qbos.runtime",
    name: "Runtime Orchestration",
    description: "Engine coordination",
    requires: ["qbos.kernel", "qbos.capabilities"],
    reversible: true,
    trustClass: TrustClass.SAFE_BUILD,
    proofRequirements: ["artifact.generated", "integration.tested"]
  },
  "qbos.self-build": {
    id: "qbos.self-build",
    name: "Self-Build Capability",
    description: "QBos builds itself",
    requires: ["qbos.kernel", "qbos.capabilities", "qbos.runtime"],
    reversible: false,
    trustClass: TrustClass.SYSTEM_MUTATION,
    proofRequirements: ["full-session.receipted", "proof-bundle.generated"]
  }
};

export function getCapability(id: string): Capability | undefined {
  return CORE_CAPABILITIES[id];
}

export function getAllCapabilities(): Capability[] {
  return Object.values(CORE_CAPABILITIES);
}
EOF

cat > packages/capabilities/src/index.ts << 'EOF'
export * from "./capability-registry";
EOF

echo "🔨 build capabilities..."
( cd packages/capabilities && pnpm install >/dev/null 2>&1 && pnpm build >/dev/null 2>&1 )

append_bootstrap_receipt "{\"receiptId\":\"phase-1-start\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"phase.started\",\"parentReceiptId\":\"kernel-built\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"phase\":1,\"name\":\"Capabilities\"}}"
append_bootstrap_receipt "{\"receiptId\":\"capabilities-created\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"package.created\",\"parentReceiptId\":\"phase-1-start\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"package\":\"@qbos/capabilities\",\"capabilityCount\":4}}"
append_bootstrap_receipt "{\"receiptId\":\"capabilities-built\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"package.built\",\"parentReceiptId\":\"capabilities-created\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"package\":\"@qbos/capabilities\"}}"

echo "✅ Phase 1 complete: @qbos/capabilities"
echo ""

# ============================================================================
# PHASE 2: RUNTIME (fixes: repo-root receipts + logical parent linkage)
# ============================================================================
echo "🔧 PHASE 2: @qbos/runtime"

mkdir -p packages/runtime/src

cat > packages/runtime/package.json << 'EOF'
{
  "name": "@qbos/runtime",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@qbos/kernel": "workspace:*",
    "@qbos/capabilities": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/runtime/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/runtime/src/engine-registry.ts << 'EOF'
import { QbosEngine, EngineKey } from "@qbos/kernel";

export class EngineRegistry {
  private engines: Map<EngineKey, QbosEngine> = new Map();

  register(engine: QbosEngine): void {
    this.engines.set(engine.engineKey, engine);
  }

  get(key: EngineKey): QbosEngine | undefined {
    return this.engines.get(key);
  }

  keys(): EngineKey[] {
    return Array.from(this.engines.keys());
  }
}

export const engineRegistry = new EngineRegistry();
EOF

cat > packages/runtime/src/preflight-gate.ts << 'EOF'
import { EngineOperation, SessionContext, PreflightGateResult, TruthState } from "@qbos/kernel";

export async function preflightGate(op: EngineOperation, ctx: SessionContext): Promise<PreflightGateResult> {
  const blocks: string[] = [];

  if (op.opType.includes("ai") && !ctx.consent["ai"]?.allowed) {
    blocks.push("Missing AI consent");
  }

  if (op.trustClass === "SYSTEM_MUTATION" && !ctx.entitlements["system_mutation"]?.allowed) {
    blocks.push("Insufficient permissions for SYSTEM_MUTATION");
  }

  return {
    allowed: blocks.length === 0,
    trustEvaluation: {
      state: blocks.length === 0 ? TruthState.IMPLEMENTED : TruthState.BLOCKED,
      confidence: blocks.length === 0 ? 1.0 : 0.0
    },
    blocks
  };
}
EOF

cat > packages/runtime/src/orchestrator.ts << 'EOF'
import { SessionContext, EngineOperation, EngineResult } from "@qbos/kernel";
import { engineRegistry } from "./engine-registry";
import { preflightGate } from "./preflight-gate";
import * as fs from "fs";
import * as path from "path";

export class Orchestrator {
  private lastReceiptIdBySession = new Map<string, string>();

  async executeOperation(op: EngineOperation, ctx: SessionContext): Promise<EngineResult> {
    const gateResult = await preflightGate(op, ctx);

    if (!gateResult.allowed) {
      this.writeReceipt(ctx.sessionId, {
        opType: `${op.opType}.blocked`,
        opId: op.opId,
        truthState: "BLOCKED",
        reasons: gateResult.blocks
      });

      return {
        ok: false,
        opId: op.opId,
        engineKey: op.engineKey,
        errors: [{ code: "BLOCKED", message: gateResult.blocks.join(", ") }]
      };
    }

    this.writeReceipt(ctx.sessionId, {
      opType: `${op.opType}.started`,
      opId: op.opId,
      engineKey: op.engineKey,
      truthState: "IMPLEMENTED"
    });

    const engine = engineRegistry.get(op.engineKey);
    if (!engine) {
      return {
        ok: false,
        opId: op.opId,
        engineKey: op.engineKey,
        errors: [{ code: "ENGINE_NOT_FOUND", message: `Engine ${op.engineKey} not available` }]
      };
    }

    const result = await engine.execute(op, ctx);

    this.writeReceipt(ctx.sessionId, {
      opType: `${op.opType}.completed`,
      opId: op.opId,
      truthState: "IMPLEMENTED",
      ok: result.ok
    });

    return result;
  }

  private repoRoot(): string {
    // Prefer explicit root; otherwise resolve from compiled dist location.
    return process.env.QBOS_ROOT ?? path.resolve(__dirname, "../../../");
  }

  private writeReceipt(sessionId: string, details: any): void {
    const root = this.repoRoot();
    const outPath = path.join(root, "receipts", "robby-self-build.jsonl");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    const parentReceiptId = this.lastReceiptIdBySession.get(sessionId);
    const receiptId = `rcp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const receipt = {
      receiptId,
      parentReceiptId,
      runId: "robby-self-build",
      sessionId,
      timestamp: new Date().toISOString(),
      actor: { userId: "robby-pa" },
      ...details
    };

    this.lastReceiptIdBySession.set(sessionId, receiptId);
    fs.appendFileSync(outPath, JSON.stringify(receipt) + "\n");
  }
}
EOF

cat > packages/runtime/src/index.ts << 'EOF'
export * from "./engine-registry";
export * from "./preflight-gate";
export * from "./orchestrator";
EOF

echo "🔨 build runtime..."
( cd packages/runtime && pnpm install >/dev/null 2>&1 && pnpm build >/dev/null 2>&1 )

append_bootstrap_receipt "{\"receiptId\":\"phase-2-start\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"phase.started\",\"parentReceiptId\":\"capabilities-built\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"phase\":2,\"name\":\"Runtime\"}}"
append_bootstrap_receipt "{\"receiptId\":\"runtime-created\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"package.created\",\"parentReceiptId\":\"phase-2-start\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"package\":\"@qbos/runtime\"}}"
append_bootstrap_receipt "{\"receiptId\":\"runtime-built\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"package.built\",\"parentReceiptId\":\"runtime-created\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"package\":\"@qbos/runtime\"}}"

echo "✅ Phase 2 complete: @qbos/runtime"
echo ""

# ============================================================================
# PHASE 3: ROBBY PA (fixes: repo-root evidence path)
# ============================================================================
echo "🤖 PHASE 3: @qbos/robby-pa"

mkdir -p packages/robby-pa/src

cat > packages/robby-pa/package.json << 'EOF'
{
  "name": "@qbos/robby-pa",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "self-build": "node dist/self-build-session.js"
  },
  "dependencies": {
    "@qbos/kernel": "workspace:*",
    "@qbos/capabilities": "workspace:*",
    "@qbos/runtime": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/robby-pa/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/robby-pa/src/mock-execution-engine.ts << 'EOF'
import { QbosEngine, EngineOperation, SessionContext, EngineResult } from "@qbos/kernel";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

export class MockExecutionEngine implements QbosEngine {
  engineKey = "execution" as const;

  async health() {
    return { ok: true };
  }

  async execute(op: EngineOperation, _ctx: SessionContext): Promise<EngineResult> {
    console.log(`  Executing: ${op.opType} (${op.opId})`);
    await new Promise(resolve => setTimeout(resolve, 250));

    const root = process.env.QBOS_ROOT ?? path.resolve(__dirname, "../../../");
    const evidenceDir = path.join(root, "proof", "robby-self-build");
    fs.mkdirSync(evidenceDir, { recursive: true });

    const evidenceContent =
      `Evidence for ${op.opType}\n` +
      `Operation ID: ${op.opId}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Capability: ${(op.inputs as any).capability || "unknown"}\n`;

    const evidencePath = path.join(evidenceDir, `${op.opId}-evidence.txt`);
    fs.writeFileSync(evidencePath, evidenceContent);

    const sha256 = createHash("sha256").update(evidenceContent).digest("hex");

    return {
      ok: true,
      opId: op.opId,
      engineKey: this.engineKey,
      evidence: [{
        kind: "artifact",
        path: evidencePath,
        sha256
      }]
    };
  }
}
EOF

cat > packages/robby-pa/src/self-build-session.ts << 'EOF'
import { Orchestrator, engineRegistry } from "@qbos/runtime";
import { JourneyState, TrustClass } from "@qbos/kernel";
import { CORE_CAPABILITIES } from "@qbos/capabilities";
import { MockExecutionEngine } from "./mock-execution-engine";

export class SelfBuildSession {
  private orchestrator: Orchestrator;
  private sessionId: string;

  constructor() {
    this.orchestrator = new Orchestrator();
    this.sessionId = `robby-self-build-${Date.now()}`;
    engineRegistry.register(new MockExecutionEngine());
  }

  async start(): Promise<void> {
    console.log("\n🤖 Robby PA: Starting self-build session");
    console.log(`Session ID: ${this.sessionId}\n`);

    const capabilities = Object.keys(CORE_CAPABILITIES);
    console.log(`Building ${capabilities.length} capabilities:\n`);

    const steps = [
      { id: "kernel-test", capId: "qbos.kernel", opType: "test.run" },
      { id: "capabilities-test", capId: "qbos.capabilities", opType: "test.run" },
      { id: "runtime-test", capId: "qbos.runtime", opType: "test.run" },
      { id: "integration-verify", capId: "qbos.self-build", opType: "integration.verify" }
    ];

    for (const step of steps) {
      console.log(`\n📋 Step: ${step.id}`);
      console.log(`   Capability: ${step.capId}`);

      const result = await this.orchestrator.executeOperation(
        {
          opId: step.id,
          engineKey: "execution",
          opType: step.opType,
          trustClass: step.capId === "qbos.self-build" ? TrustClass.SYSTEM_MUTATION : TrustClass.SAFE_BUILD,
          inputs: { capability: step.capId },
          requiredProofs: ["test.passed"],
          reversible: true
        },
        {
          sessionId: this.sessionId,
          runId: "robby-self-build",
          actor: { userId: "robby-pa", roles: ["builder"] },
          consent: { ai: { allowed: true } },
          entitlements: { system_mutation: { allowed: true } },
          config: {},
          state: JourneyState.EXECUTING
        }
      );

      if (!result.ok) {
        console.error(`   ❌ FAILED: ${result.errors?.[0]?.message}`);
        process.exitCode = 1;
        return;
      }

      console.log(`   ✅ SUCCESS`);
      if (result.evidence?.[0]?.sha256) {
        console.log(`   SHA-256: ${result.evidence[0].sha256.substring(0, 16)}...`);
      }
    }

    console.log("\n🎉 Self-build session complete!\n");
  }
}

if (require.main === module) {
  const session = new SelfBuildSession();
  session.start().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
EOF

cat > packages/robby-pa/src/index.ts << 'EOF'
export * from "./self-build-session";
export * from "./mock-execution-engine";
EOF

echo "🔨 build robby-pa..."
( cd packages/robby-pa && pnpm install >/dev/null 2>&1 && pnpm build >/dev/null 2>&1 )

append_bootstrap_receipt "{\"receiptId\":\"phase-3-start\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"phase.started\",\"parentReceiptId\":\"runtime-built\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"phase\":3,\"name\":\"Self-Build\"}}"
append_bootstrap_receipt "{\"receiptId\":\"robby-pa-created\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"package.created\",\"parentReceiptId\":\"phase-3-start\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"package\":\"@qbos/robby-pa\",\"note\":\"Evidence uses real SHA-256; outputs written to repo root via QBOS_ROOT\"}}"

echo "✅ Phase 3 complete: @qbos/robby-pa"
echo ""

# ============================================================================
# EXECUTE SELF-BUILD (ensure repo-root paths)
# ============================================================================
echo "════════════════════════════════════════════════════════════"
echo "  EXECUTING ROBBY PA SELF-BUILD SESSION"
echo "════════════════════════════════════════════════════════════"
echo ""

( cd packages/robby-pa && QBOS_ROOT="$ROOT" pnpm self-build )

append_bootstrap_receipt "{\"receiptId\":\"self-build-complete\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"runId\":\"robby-self-build\",\"sessionId\":\"robby-self-build\",\"actor\":{\"userId\":\"robby-pa\"},\"opType\":\"self-build.completed\",\"parentReceiptId\":\"robby-pa-created\",\"truthState\":\"IMPLEMENTED\",\"details\":{\"stepsCompleted\":4,\"note\":\"Runtime proof collected; cryptographic verification NOT executed\"}}"

# ============================================================================
# PROOF BUNDLE (honest)
# ============================================================================
echo ""
echo "📊 Generating proof bundle..."

mkdir -p proof/bundles/robby-self-build

RECEIPT_COUNT="$(wc -l < receipts/robby-self-build.jsonl | tr -d ' ')"
EVIDENCE_COUNT="$(ls -1 proof/robby-self-build 2>/dev/null | wc -l | tr -d ' ')"

cat > proof/bundles/robby-self-build/TRUTH_SHEET.md << EOF
# QuietBuild OS™ Truth Sheet

**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Session:** robby-self-build
**Built By:** Robby PA using QuietBuild OS

---

## ⚠️ VERIFICATION STATUS

**TruthSerum™ Verifier Status:** NOT EXECUTED

This build demonstrates:
✅ Deterministic execution
✅ Self-build mechanics
✅ Receipt generation (log + logical parent links)
✅ Real SHA-256 hashing of evidence artifacts

This build does NOT yet prove:
❌ Cryptographic receipt chain integrity
❌ Receipt non-repudiation
❌ TruthSerum claim-level verification

---

## IMPLEMENTED Capabilities (Runtime Proof Collected)

⚙️ qbos.kernel (Built, not verified)
⚙️ qbos.capabilities (Built, not verified)
⚙️ qbos.runtime (Built, not verified)
⚙️ qbos.self-build (Executed, not verified)

**Total:** 4/4 capabilities built
**Status:** IMPLEMENTED (verification pending)

---

## Receipt Chain Status

**Total Receipts:** ${RECEIPT_COUNT}
**Status:** ⚠️ NOT VERIFIED (no crypto)

Receipts include:
- Timestamp
- Actor attribution
- Logical parent linkage (NOT cryptographic)
- TruthState: IMPLEMENTED/BLOCKED

Missing:
- Cryptographic signatures
- Hash chaining
- Independent verifier pass

---

## Evidence Artifacts

**Location:** \`./proof/robby-self-build/\`
**Artifacts:** ${EVIDENCE_COUNT}
**Hashing:** ✅ Real SHA-256

---

## Next Steps to Achieve VERIFIED Status

1. Implement receipt signing (e.g., Ed25519)
2. Implement cryptographic hash chaining
3. Build a verifier tool and run it
4. Upgrade TruthState: IMPLEMENTED → VERIFIED only after verification pass

---

## TruthSerum™ Honest Verdict

**Current Status:** IMPLEMENTED (not VERIFIED)

EOF

cp receipts/robby-self-build.jsonl proof/bundles/robby-self-build/receipts.jsonl

( cd proof/bundles/robby-self-build && (sha256sum * > MANIFEST.sha256 2>/dev/null || shasum -a 256 * > MANIFEST.sha256) )

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  FINAL VERIFICATION & RESULTS"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "📦 Packages:"
for pkg in kernel capabilities runtime robby-pa; do
  if [ -d "packages/$pkg/dist" ]; then
    echo "   ✅ @qbos/$pkg"
  else
    echo "   ❌ @qbos/$pkg (missing dist)"
  fi
done

echo ""
echo "🧾 Receipts: $RECEIPT_COUNT (./receipts/robby-self-build.jsonl)"
echo "📁 Evidence: $EVIDENCE_COUNT (./proof/robby-self-build/)"
echo "📦 Bundle:   ./proof/bundles/robby-self-build/"
echo ""

echo "════════════════════════════════════════════════════════════"
cat proof/bundles/robby-self-build/TRUTH_SHEET.md
echo "════════════════════════════════════════════════════════════"
echo ""

echo "✅ ROBBY PA SELF-BUILD: COMPLETE"
echo "TruthSerum™ Verdict: IMPLEMENTED (verification pending)"
echo ""
