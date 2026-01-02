#!/usr/bin/env bash
set -euo pipefail

# Minimal collect-proof-evidence shim for local dev/CI.
# It should gather proof artifacts; for now it writes a simple placeholder.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
mkdir -p "$ARTIFACTS_DIR"
echo "Collected proof evidence at $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$ARTIFACTS_DIR/collect-proof-evidence.txt"
echo "OK"
