#!/usr/bin/env bash
# QuietBuild OS — Single-Run Witness Capture for Phase 4 Refusal
# Purpose: Run the Phase 4 witness script once, capture output, and archive a timestamped artifact.
# Behavior: Sets production posture, executes TypeScript witness, archives logs and a markdown summary.

set -euo pipefail

REPO_ROOT=$(pwd)
ARTIFACT_DIR="proof/witness"
MD_OUT="docs/WITNESS_PHASE4_EXECUTION_ATTEMPT_$(date -u +%Y-%m-%d).md"
LOG_OUT="$ARTIFACT_DIR/WITNESS_PHASE4_EXECUTION_ATTEMPT_$(date -u +%Y-%m-%d).out"
MARKER="$ARTIFACT_DIR/.witness_once_$(date -u +%Y-%m-%d)"

mkdir -p "$ARTIFACT_DIR"

if [[ -f "$MARKER" ]]; then
  echo "Witness already captured today: $MARKER"
  exit 0
fi

# Production posture
export NODE_ENV=production
export ROBBY_PRODUCTION=true
export ROBBY_VERIFIER_REQUIRED=true

echo "Running witness script under production posture..."

# Prefer pnpm + ts-node, fallback to npx
RUN_CMD="pnpm exec ts-node scripts/witness-phase4-execution-attempt.ts"
if ! command -v pnpm >/dev/null 2>&1; then
  RUN_CMD="npx ts-node scripts/witness-phase4-execution-attempt.ts"
fi

# Execute and capture output
set +e
$RUN_CMD | tee "$LOG_OUT"
RC=${PIPESTATUS[0]}
set -e

# Parse summary elements from log
ERROR_LINE=$(grep -E "^✖ .*: " "$LOG_OUT" | head -n1 || true)
BLOCKING_ERROR=$(awk '/^Exact blocking error:/ {getline; print; exit}' "$LOG_OUT" || true)
RECEIPT_JSON=$(awk '/^\{/{flag=1} flag{print} /^\}/{flag=0}' "$LOG_OUT" | sed -n '1,200p' || true)

# Write markdown artifact
cat > "$MD_OUT" <<EOF
# QuietBuild OS — Witness: Phase 4 Execution Attempt (Refusal)

Date (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)
Command: $RUN_CMD
Posture: NODE_ENV=production, ROBBY_PRODUCTION=true, ROBBY_VERIFIER_REQUIRED=true

## Observed Refusal

- Summary: ${ERROR_LINE:-<none>}
- Exact Blocking Error:

\`\`\`
$BLOCKING_ERROR
\`\`\`

## Witness Receipt (as emitted)

\`\`\`json
$RECEIPT_JSON
\`\`\`

## Halted State

- Process exit code: $RC (0 indicates refusal observed; 1 indicates unexpected non-refusal)
- Logs archived: $LOG_OUT
- Receipt log (append-only): ci-artifact/local_receipts.jsonl

EOF

# Mark one-time run
echo "captured" > "$MARKER"

echo "Witness artifact created: $MD_OUT"

# Exit with original witness status
exit $RC
