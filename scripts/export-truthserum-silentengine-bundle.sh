#!/usr/bin/env bash
# Bundle all TruthSerum + SilentEngine artifacts and docs for sharing with ChatGPT
set -euo pipefail
IFS=$'\n\t'

ROOT=$(pwd)
TS=$(date -u +"%Y%m%dT%H%M%SZ")
OUT_DIR="$ROOT/artifacts/truthserum-silentengine-bundle-${TS}"
mkdir -p "$OUT_DIR"

echo "Creating bundle in $OUT_DIR"

# List of important paths to include (best-effort)
paths=(
  "packages/truthserum/src/keystore.ts"
  "packages/truthserum/src/ReceiptWriter.ts"
  "verify-receipt.js"
  "scripts/smoke-truthserum.js"
  "scripts/generate-truthserum-keys.sh"
  "scripts/verify-latest.sh"
  "scripts/collect-proof-evidence.sh"
  "scripts/truth-built-works-report.mjs"
  "supabase/migrations"
  "proof"
  "proof/local_receipts.jsonl"
  "local_receipts.jsonl"
  "docs/TRUTH_SERUM_REPORT.md"
  "docs/ROB_INTELLIGENCE_REFERENCE.md"
  "docs/PRODUCTION_READINESS.md"
  ".github/workflows/truthserum-ci.yml"
  "apps/proof-harness"
  "packages/silent-engine"
  "packages/sight-engine"
  "packages/engines"
  "package.json"
  "tsconfig.json"
  "README.md"
  "scripts/collect-proof-evidence.sh"
  "scripts/truth-built-works-report.mjs"
  "scripts/export-truthserum-silentengine-bundle.sh"
  "docs/TRUTHSERUM_SILENTENGINE_CHATGPT_PROMPT.md"
)

for p in "${paths[@]}"; do
  if [ -e "$ROOT/$p" ]; then
    dest="$OUT_DIR/$(dirname "$p")"
    mkdir -p "$dest"
    if [ -d "$ROOT/$p" ]; then
      cp -r "$ROOT/$p" "$OUT_DIR/collected/" || true
    else
      cp -p "$ROOT/$p" "$OUT_DIR/collected/$(basename "$p")" || true
    fi
  fi
done

# Add a small manifest describing what was included
cat > "$OUT_DIR/manifest.txt" <<EOF
TruthSerum + SilentEngine bundle
Generated: $TS

Included paths (best-effort):
EOF

for p in "${paths[@]}"; do
  if [ -e "$ROOT/$p" ]; then
    echo "$p" >> "$OUT_DIR/manifest.txt"
  fi
done

# Create compressed archive
ARCHIVE="$ROOT/artifacts/truthserum-silentengine-bundle-${TS}.tar.gz"
tar -C "$OUT_DIR" -czf "$ARCHIVE" .

echo "Bundle created: $ARCHIVE"
echo "Copy or upload that archive to share with ChatGPT/Claude or attach to issues/PRs."

exit 0
