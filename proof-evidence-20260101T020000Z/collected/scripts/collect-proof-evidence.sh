#!/usr/bin/env bash
# Collect proof-evidence for QBos: local receipts, smoke runs, verify output, docs, migrations, CI artifacts.
set -uo pipefail
IFS=$'\n\t'

ROOT="$(pwd)"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
OUT="proof-evidence-${TS}"
mkdir -p "$OUT"
echo "Collecting proof evidence into $OUT"

# 1) Git metadata
{
  echo "repo: $(basename "$ROOT")"
  echo "commit: $(git rev-parse HEAD 2>/dev/null || echo 'no-git')"
  echo "branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'no-git')"
  echo ""
  echo "git status --porcelain:"
  git status --porcelain 2>/dev/null || true
  echo ""
  echo "last 50 commits:"
  git log -n 50 --pretty=oneline 2>/dev/null || true
} > "$OUT/git-info.txt"

# 2) Copy key documentation and claimed files (if present)
COPY_PATHS=(
  README.md
  GETTING_STARTED.md
  PRODUCTION_READINESS.md
  PRODUCTION_STATUS_DEC24.md
  docs
  scripts
  supabase/migrations
  .github/workflows
  packages/truthserum/src/keystore.ts
  packages/truthserum/src/ReceiptWriter.ts
  proof
  apps
  package.json
  tsconfig.json
)

echo "Copying docs and config..."
for p in "${COPY_PATHS[@]}"; do
  if [ -e "$p" ]; then
    dest="$OUT/collected/$(dirname "$p")"
    mkdir -p "$dest"
    if [ -d "$p" ]; then
      cp -r "$p" "$OUT/collected/" 2>/dev/null || true
    else
      cp -p "$p" "$OUT/collected/$(basename "$p")" 2>/dev/null || true
    fi
  fi
done

# 3) Save a short inventory of scripts and package.json scripts
jq -C .scripts package.json 2>/dev/null > "$OUT/package-scripts.json" || true

# 4) Optionally run `npm ci` to ensure node scripts run (set NO_INSTALL=1 to skip)
if [ "${NO_INSTALL:-}" != "1" ]; then
  echo "Installing node deps (npm ci). Set NO_INSTALL=1 to skip."
  npm ci --silent >/dev/null 2>&1 || echo "npm ci failed or skipped"
fi

# 5) Run smoke script (if present). Capture outputs but never stop the collection on failure.
SMOKE_OUT="$OUT/smoke.out"
if [ -f "scripts/smoke-truthserum.js" ]; then
  echo "Running smoke: scripts/smoke-truthserum.js"
  node scripts/smoke-truthserum.js > "$SMOKE_OUT" 2>&1 || echo "smoke script exited non-zero (see $SMOKE_OUT)"
elif [ -f "scripts/smoke-truthserum.ts" ]; then
  echo "Found TypeScript smoke script; attempting ts-node if available."
  if command -v ts-node >/dev/null 2>&1; then
    ts-node scripts/smoke-truthserum.ts > "$SMOKE_OUT" 2>&1 || echo "ts smoke script exited non-zero"
  else
    echo "ts-node not available; skipping TypeScript smoke run." > "$SMOKE_OUT"
  fi
else
  echo "No smoke script found." > "$SMOKE_OUT"
fi

# 6) Run verify-latest helper (if present)
VERIFY_OUT="$OUT/verify.out"
if [ -f "./scripts/verify-latest.sh" ]; then
  echo "Running verify-latest.sh (may require PUBLIC_KEY_PEM_BASE64 or PUBLIC_KEY_PATH)..."
  chmod +x ./scripts/verify-latest.sh
  ./scripts/verify-latest.sh > "$VERIFY_OUT" 2>&1 || echo "verify-latest exited non-zero (see $VERIFY_OUT)"
else
  echo "No verify-latest.sh found; looking for verify-receipt.js"
  if [ -f "./verify-receipt.js" ]; then
    node verify-receipt.js > "$VERIFY_OUT" 2>&1 || echo "verify-receipt.js exited non-zero"
  else
    echo "No verifier found." > "$VERIFY_OUT"
  fi
fi

# 7) Collect proof dir / receipts (if present)
if [ -d "proof" ]; then
  mkdir -p "$OUT/collected/proof"
  cp -p proof/* "$OUT/collected/proof/" 2>/dev/null || true
fi

# 8) Attempt to download latest CI artifact 'truthserum-verification' (requires gh CLI and auth)
CI_DIR="$OUT/ci-artifact"
if command -v gh >/dev/null 2>&1; then
  echo "Attempting to download latest GitHub Actions artifact 'truthserum-verification' (requires gh auth)."
  LATEST_RUN=$(gh run list --workflow truthserum-ci.yml --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")
  if [ -n "$LATEST_RUN" ]; then
    mkdir -p "$CI_DIR"
    echo "Latest run id: $LATEST_RUN"
    gh run download "$LATEST_RUN" --name truthserum-verification --dir "$CI_DIR" >/dev/null 2>&1 && echo "Downloaded CI artifact to $CI_DIR" || echo "Failed to download CI artifact (check gh auth and artifact existence)"
  else
    echo "Could not determine latest run for workflow truthserum-ci.yml" > "$OUT/ci-download.log"
  fi
else
  echo "gh CLI not found; skipping CI artifact download." > "$OUT/ci-download.log"
fi

# 9) Snapshot environment variables relevant to proof (avoid printing secrets)
{
  echo "ENV VARS SNAPSHOT (only presence; secret values redacted):"
  vars=(TRUTHSERUM_PRIVATE_KEY_PEM_BASE64 TRUTHSERUM_PUBLIC_KEY_PEM_BASE64 PUBLIC_KEY_PEM_BASE64 SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY)
  for v in "${vars[@]}"; do
    if [ -n "${!v:-}" ]; then
      echo "$v=SET"
    else
      echo "$v=NOT_SET"
    fi
  done
} > "$OUT/env-snapshot.txt"

# 10) Create archive
ARCHIVE="${OUT}.tar.gz"
tar -czf "$ARCHIVE" "$OUT" || echo "tar failed"
echo ""
echo "Done. Evidence collected into: $OUT and archive: $ARCHIVE"
echo "Contents:"
ls -la "$OUT" || true
echo ""
echo "Next steps:"
echo "- Inspect $OUT/collected/proof and $OUT/smoke.out and $OUT/verify.out for receipts and verification logs."
echo "- If you want me to analyze outputs, upload the archive or paste the relevant $OUT/verify.out here."
