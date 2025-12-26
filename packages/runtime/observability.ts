import * as fs from "fs";
import * as path from "path";

export type ObservabilityEventType =
  | "app.built"
  | "deploy.attempted"
  | "verify.passed"
  | "verify.failed";

export interface ObservabilityEvent {
  type: ObservabilityEventType;
  timestamp: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export function logObservabilityEvent(
  event: ObservabilityEvent,
  filePath = "proof/_artifacts/07_os_foundation/observability_events.jsonl"
): void {
  const resolved = path.resolve(process.cwd(), filePath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.appendFileSync(resolved, `${JSON.stringify(event)}\n`, "utf-8");
}
