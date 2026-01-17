import fs from "fs/promises";
import path from "path";

const DEFAULT_MAX_FILE_SIZE_KB = 500;

export class PolicyEnforcer {
  private robbyDir: string;
  private decisions: any | null = null;
  private policies: any | null = null;

  constructor(robbyDir: string) {
    this.robbyDir = robbyDir;
  }

  private async loadDecisions() {
    if (this.decisions) return this.decisions;
    try {
      const file = path.join(this.robbyDir, "DECISIONS.json");
      const txt = await fs.readFile(file, "utf8");
      this.decisions = JSON.parse(txt);
    } catch (e) {
      this.decisions = null;
    }
    return this.decisions;
  }

  private async loadPolicy(platform: string) {
    if (this.policies && this.policies[platform])
      return this.policies[platform];
    try {
      const file = path.join(this.robbyDir, "POLICIES", `${platform}.v1.json`);
      const txt = await fs.readFile(file, "utf8");
      this.policies = this.policies || {};
      this.policies[platform] = JSON.parse(txt);
    } catch (e) {
      this.policies = this.policies || {};
      this.policies[platform] = null;
    }
    return this.policies[platform];
  }

  public async enforce(category: string, ctx: any) {
    // category maps to a platform name in policies (filesystem, terminal, git, supabase)
    const platform = category || "filesystem";
    const policy = await this.loadPolicy(platform);
    const decisions = await this.loadDecisions();

    if (!policy && !decisions) {
      throw new Error("no_policy_and_no_decisions");
    }

    // Simple filesystem enforcement
    if (platform === "filesystem") {
      const pathTarget = (ctx.metadata && ctx.metadata.path) || "";
      const allowedRoots = (decisions &&
        decisions.keys &&
        decisions.keys.allowed_write_roots) ||
        policy?.rules?.write_roots || ["docs/", ".robby/"];
      const forbidden =
        (decisions && decisions.keys && decisions.keys.forbidden_paths) ||
        policy?.rules?.forbidden_paths ||
        [];

      // patch-only mode check
      const patchOnly =
        (decisions &&
          decisions.keys &&
          decisions.keys.write_mode === "patch_only") ||
        policy?.rules?.patch_only_mode;
      if (patchOnly && ctx.metadata && ctx.metadata.mode === "overwrite") {
        throw new Error("patch_only_mode");
      }

      const allowed = allowedRoots.some((r: string) =>
        pathTarget.startsWith(r),
      );
      if (!allowed) throw new Error("write_root_not_allowed");

      for (const f of forbidden) {
        if (!f) continue;
        if (pathTarget.startsWith(f.replace(/\*$/, ""))) {
          throw new Error("forbidden_path");
        }
      }

      // file size check (if provided)
      if (ctx.metadata && ctx.metadata.size_kb) {
        const max = policy?.rules?.max_file_size_kb || DEFAULT_MAX_FILE_SIZE_KB;
        if (ctx.metadata.size_kb > max) throw new Error("file_too_large");
      }
    }

    // Terminal enforcement
    if (platform === "terminal") {
      const cmd = (ctx.metadata && ctx.metadata.cmd) || "";
      const decisionsCmds =
        decisions && decisions.keys && decisions.keys.terminal_allowed_commands;
      const allowedCmds =
        policy?.rules?.allowed_commands || decisionsCmds || [];
      const forbidden =
        policy?.rules?.forbidden_commands ||
        (decisions &&
          decisions.keys &&
          decisions.keys.terminal_forbidden_commands) ||
        [];

      const base = cmd.split(" ")[0];
      if (forbidden.includes(base))
        throw new Error("terminal_forbidden_command");
      if (
        Array.isArray(allowedCmds) &&
        allowedCmds.length > 0 &&
        !allowedCmds.includes(base)
      )
        throw new Error("terminal_command_not_allowed");
    }

    // Git enforcement (basic)
    if (platform === "git") {
      const branch = (ctx.metadata && ctx.metadata.branch) || "";
      const prefix =
        decisions && decisions.keys && decisions.keys.default_branch_prefix;
      if (prefix && branch && !branch.startsWith(prefix)) {
        // allow but warn: for now treat as violation
        throw new Error("branch_prefix_violation");
      }
    }

    // If we reach here, policy passed (basic checks)
    return true;
  }
}

export default PolicyEnforcer;
