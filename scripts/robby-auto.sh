#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-unit}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="$ROOT/packages/robby-pa"

echo "Repo root: $ROOT"
echo "Mode: $MODE"

if [ ! -d "$PKG" ]; then
  echo "ERROR: packages/robby-pa not found at: $PKG"
  find "$ROOT" -maxdepth 6 -type d -name "robby-pa" -print || true
  exit 1
fi

run_unit() {
  echo "Running robby-pa unit tests..."
  pnpm -C "$PKG" install
  pnpm -C "$PKG" test
}

pg_up() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker not found. Install Docker Desktop first."
    exit 1
  fi

  # prefer robby-pa's docker compose if present
  if [ -f "$PKG/dev/docker-compose.yml" ]; then
    echo "Starting Postgres (robby-pa/dev/docker-compose.yml)..."
    docker compose -f "$PKG/dev/docker-compose.yml" up -d
    return
  fi

  # fallback: run a standalone container
  echo "Starting Postgres (standalone container)..."
  docker rm -f robby-pa-pg >/dev/null 2>&1 || true
  docker run -d --name robby-pa-pg \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=robby_pa \
    -p 5432:5432 \
    postgres:16
}

pg_down() {
  if command -v docker >/dev/null 2>&1; then
    docker compose -f "$PKG/dev/docker-compose.yml" down >/dev/null 2>&1 || true
    docker rm -f robby-pa-pg >/dev/null 2>&1 || true
  fi
}

run_verify() {
  echo "Running verify runner (if present)..."

  if [ -z "${ROBBY_RECEIPT_MAC_SECRET:-}" ]; then
    echo "ERROR: ROBBY_RECEIPT_MAC_SECRET is not set."
    echo "Set it first: export ROBBY_RECEIPT_MAC_SECRET='...'"
    exit 1
  fi

  # Try common runner locations without guessing one
  if [ -f "$PKG/bin/verify.mjs" ]; then
    node "$PKG/bin/verify.mjs"
    return
  fi

  if [ -f "$PKG/bin/verify.js" ]; then
    node "$PKG/bin/verify.js"
    return
  fi

  if jq -e '.scripts["robby:verify"]' "$PKG/package.json" >/dev/null 2>&1; then
    pnpm -C "$PKG" robby:verify
    return
  fi

  echo "ERROR: No verify runner found (bin/verify.mjs | bin/verify.js | scripts.robby:verify)."
  ls -la "$PKG/bin" || true
  exit 1
}

case "$MODE" in
  unit)
    run_unit
    ;;
  all)
    run_unit
    ;;
  pg-up)
    pg_up
    ;;
  pg-down)
    pg_down
    ;;
  verify)
    run_verify
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: scripts/robby-auto.sh [unit|all|pg-up|pg-down|verify]"
    exit 1
    ;;
esac
