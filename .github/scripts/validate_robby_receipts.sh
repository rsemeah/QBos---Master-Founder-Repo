#!/usr/bin/env bash
set -euo pipefail

ROOT="$PWD"
ROBBY_DIR="$ROOT/.robby"
RECEIPTS_DIR="$ROBBY_DIR/receipts"

echo "Validating .robby presence..."
if [ ! -d "$ROBBY_DIR" ]; then
  echo "ERROR: .robby directory missing"
  exit 1
fi

if [ ! -f "$ROBBY_DIR/DECISIONS.json" ]; then
  echo "ERROR: .robby/DECISIONS.json missing"
  exit 1
fi

echo "Scanning receipts for approval.intent..."
if [ ! -d "$RECEIPTS_DIR" ]; then
  echo "ERROR: .robby/receipts directory missing"
  exit 1
fi

found=0
for f in "$RECEIPTS_DIR"/*.json; do
  if [ -f "$f" ]; then
    if grep -q '"intentKey"[[:space:]]*:[[:space:]]*"approval.intent"' "$f" || grep -q '"type"[[:space:]]*:[[:space:]]*"approval.intent"' "$f"; then
      echo "Found approval in: $f"
      found=1
      break
    fi
  fi
done

if [ "$found" -ne 1 ]; then
  echo "ERROR: No approval.intent receipt found in .robby/receipts"
  echo "Create an approval.intent receipt before merging."
  exit 1
fi

echo "Robby receipts validation passed."
exit 0
