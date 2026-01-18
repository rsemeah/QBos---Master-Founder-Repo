import fs from "fs/promises";
import path from "path";
import { ApprovalVerifier } from "./ApprovalVerifier";
import { PolicyEnforcer } from "./PolicyEnforcer";

// Prefer workspace process current working directory so tests and
// runtime resolve the repository root consistently.
const REPO_ROOT = process.cwd();
const ROBBY_DIR = path.join(REPO_ROOT, ".robby");
const RECEIPTS_DIR = path.join(ROBBY_DIR, "receipts");

export interface GuardContext {
  action_id: string;
  category?: string;
  scope?: string;
  sessionId?: string;
  runId?: string;
  metadata?: Record<string, any>;
}

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  receipts: string[];
}

export class ActionGuard {
  private policy: PolicyEnforcer;
  private approver: ApprovalVerifier;

  constructor() {
    this.policy = new PolicyEnforcer(ROBBY_DIR);
    this.approver = new ApprovalVerifier(ROBBY_DIR);
  }

  private async readJson(file: string) {
    try {
      const content = await fs.readFile(file, "utf8");
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }

  private async emitReceipt(name: string, payload: any) {
    await fs.mkdir(RECEIPTS_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(RECEIPTS_DIR, `${ts}-${name}.json`);
    await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
    return file;
  }

  public async guardAction(ctx: GuardContext): Promise<GuardResult> {
    const receipts: string[] = [];

    // Always emit action.requested
    const requested = await this.emitReceipt("action.requested", {
      action_id: ctx.action_id,
      category: ctx.category || null,
      scope: ctx.scope || null,
      sessionId: ctx.sessionId || null,
      runId: ctx.runId || null,
      metadata: ctx.metadata || {},
      ts: new Date().toISOString(),
    });
    receipts.push(requested);

    // Load registry
    const registry = await this.readJson(
      path.join(ROBBY_DIR, "REGISTRY", "actions.v1.json"),
    );
    if (!registry || !Array.isArray(registry.actions)) {
      const r = await this.emitReceipt("action.denied", {
        reason: "missing_registry",
      });
      receipts.push(r);
      return { allowed: false, reason: "registry_missing", receipts };
    }

    const action = registry.actions.find(
      (a: any) => a.action_id === ctx.action_id,
    );
    if (!action) {
      const r = await this.emitReceipt("action.denied", {
        reason: "unknown_action",
        action_id: ctx.action_id,
      });
      receipts.push(r);
      return { allowed: false, reason: "unknown_action", receipts };
    }

    // Enforce policy for category
    try {
      await this.policy.enforce(
        action.category || ctx.category || "unknown",
        ctx,
      );
    } catch (e: any) {
      const r = await this.emitReceipt("action.denied", {
        reason: "policy_violation",
        detail: e?.message,
      });
      receipts.push(r);
      return { allowed: false, reason: "policy_violation", receipts };
    }

    // If action requires BrainSmart, verify approval receipts
    if (action.requires_brainsmart) {
      const ok = await this.approver.verifyApproval({
        sessionId: ctx.sessionId,
        runId: ctx.runId,
        scope: ctx.scope,
      });
      if (!ok) {
        const r = await this.emitReceipt("action.denied", {
          reason: "missing_brainsmart_approval",
        });
        receipts.push(r);
        return {
          allowed: false,
          reason: "missing_brainsmart_approval",
          receipts,
        };
      }
    }

    // Allowed
    const allowedReceipt = await this.emitReceipt("action.allowed", {
      action_id: ctx.action_id,
      scope: ctx.scope || null,
      sessionId: ctx.sessionId || null,
      runId: ctx.runId || null,
      ts: new Date().toISOString(),
    });
    receipts.push(allowedReceipt);

    return { allowed: true, receipts };
  }
}

export default ActionGuard;
