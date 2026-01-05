#!/usr/bin/env bash
set -euo pipefail

echo "== QBos: Robby Auto Runner =="

echo "-- workspace root: $(pwd)"

echo "-- install"
pnpm install --frozen-lockfile=false

echo "-- test: robby-pa"
pnpm -C packages/robby-pa test

echo "-- test: truthserum"
pnpm -C packages/truthserum test

if [[ -n "${ROBBY_RECEIPT_MAC_SECRET:-}" ]]; then
  echo "-- verify: robby-pa"
  # If your verify script name differs, update this one line
  pnpm -C packages/robby-pa run verify
else
  echo "-- verify skipped (ROBBY_RECEIPT_MAC_SECRET not set)"
fi

echo "== DONE =="
