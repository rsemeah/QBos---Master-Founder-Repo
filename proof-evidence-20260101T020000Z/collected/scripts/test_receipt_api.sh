#!/usr/bin/env bash
# Simple script to POST a sample receipt to the local /api/receipts endpoint.
# Usage: ./scripts/test_receipt_api.sh [PORT]
PORT=${1:-3000}
URL="http://localhost:${PORT}/api/receipts"

cat <<'JSON' | curl -s -X POST -H "Content-Type: application/json" -d @- "$URL"
{
  "type": "test.receipt",
  "proof_type": "integration_test",
  "payload": { "ok": true, "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)" }
}
JSON

echo "\nPosted sample receipt to $URL"
