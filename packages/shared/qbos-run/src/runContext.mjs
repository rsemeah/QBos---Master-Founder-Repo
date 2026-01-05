import path from "node:path";

export function getRunId() {
  return (
    process.env.QBOS_RUN_ID || process.env.ROBBY_RUN_ID || `dev-${Date.now()}`
  );
}

export function getReceiptsDir(pkgName) {
  const runId = getRunId();
  const root = process.env.QBOS_RECEIPTS_ROOT;
  if (root) return path.join(root, pkgName, "runs", runId);
  return path.join("packages", pkgName, "receipts", "runs", runId);
}
