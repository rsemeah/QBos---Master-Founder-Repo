#!/usr/bin/env bash
set -euo pipefail

# Verify that the latest receipt in receipts/robby/robby.receipts.jsonl is signed
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RECEIPT_FILE="$ROOT_DIR/receipts/robby/robby.receipts.jsonl"

if [ ! -f "$RECEIPT_FILE" ]; then
  echo "verify-latest: receipts file not found: $RECEIPT_FILE" >&2
  exit 1
fi

last=$(tail -n 1 "$RECEIPT_FILE" | tr -d '\r' | sed -e '/^$/d' | tail -n 1)
if [ -z "$last" ]; then
  echo "verify-latest: last receipt is empty" >&2
  exit 1
fi

# Fail if signature is explicitly null; succeed if any non-null value present
if echo "$last" | grep -q '"signature"\s*:\s*null'; then
  echo "verify-latest: latest receipt is not signed" >&2
  exit 2
fi

echo "verify-latest: latest receipt appears signed" >&2
exit 0
