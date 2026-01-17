import fs from "fs/promises";
import path from "path";

const DEFAULT_WINDOW_MS = 1000 * 60 * 60; // 1 hour

export interface ApprovalQuery {
  sessionId?: string | null;
  runId?: string | null;
  scope?: string | null;
}

export class ApprovalVerifier {
  private robbyDir: string;
  private receiptsDir: string;

  constructor(robbyDir: string) {
    this.robbyDir = robbyDir;
    this.receiptsDir = path.join(this.robbyDir, "receipts");
  }

  private async listReceipts() {
    try {
      const files = await fs.readdir(this.receiptsDir);
      return files.map((f) => path.join(this.receiptsDir, f));
    } catch (e) {
      return [];
    }
  }

  public async verifyApproval(q: ApprovalQuery) {
    // Search receipts for an approval.intent that matches session/run/scope and is not expired
    const receipts = await this.listReceipts();
    for (const r of receipts) {
      try {
        const txt = await fs.readFile(r, "utf8");
        const obj = JSON.parse(txt);
        // quick filter by presence
        if (obj && obj.type === "approval.intent") {
          const details = obj.details || obj;
          const matchSession =
            !q.sessionId || details.session_id === q.sessionId;
          const matchRun = !q.runId || details.run_id === q.runId;
          const matchScope = !q.scope || details.scope === q.scope;
          const approved = !!details.approved;
          const expires = details.expires_at
            ? new Date(details.expires_at).getTime()
            : null;
          const now = Date.now();
          const notExpired = !expires || expires > now;
          if (matchSession && matchRun && matchScope && approved && notExpired)
            return true;
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return false;
  }
}

export default ApprovalVerifier;
