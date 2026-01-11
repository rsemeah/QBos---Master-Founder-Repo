#!/usr/bin/env bash
# QuietBuild OS — Assemble Generic Auditor Handoff Bundle (Read-Only)
# Packages the minimal artifacts into a timestamped tarball under proof/auditor-bundle.

set -euo pipefail

OUT_ROOT="proof/auditor-bundle"
DATE_UTC=$(date -u +%Y-%m-%d)
OUT_DIR="$OUT_ROOT/$DATE_UTC"
BUNDLE_TAR="$OUT_ROOT/auditor-bundle-$DATE_UTC.tar.gz"

mkdir -p "$OUT_DIR"

# Files to include
FILES=(
  "docs/TRANSLATION_TECHNICAL_AUDITOR.md"
  "CONSTITUTION_FREEZE.md"
  "docs/AUDITOR_INVITATION.md"
  "docs/auditor-handoff/README.md"
)

# Witness artifact (prefer exact date, fallback to any)
WITNESS_MD="docs/WITNESS_PHASE4_EXECUTION_ATTEMPT_${DATE_UTC}.md"
if [[ -f "$WITNESS_MD" ]]; then
  FILES+=("$WITNESS_MD")
else
  echo "Witness artifact for $DATE_UTC not found; include any available witness artifacts."
  for f in docs/WITNESS_PHASE4_EXECUTION_ATTEMPT_*.md; do
    [[ -f "$f" ]] && FILES+=("$f")
  done
fi

# Copy files
for f in "${FILES[@]}"; do
  if [[ -f "$f" ]]; then
    mkdir -p "$OUT_DIR/$(dirname "$f")"
    cp "$f" "$OUT_DIR/$f"
  else
    echo "Missing expected file: $f" >&2
  fi
done

# Create tarball
pushd "$OUT_DIR" >/dev/null
tar -czf "../$(basename "$BUNDLE_TAR")" .
popd >/dev/null

echo "Bundle created: $BUNDLE_TAR"
ls -lah "$BUNDLE_TAR"
