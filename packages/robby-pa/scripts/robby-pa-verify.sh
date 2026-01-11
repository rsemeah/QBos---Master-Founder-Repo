#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../.. && pwd)"
PKG_DIR="$ROOT_DIR/packages/robby-pa"
RECEIPTS_DIR="$PKG_DIR/receipts"
NOW_TS="$(date +%s)"
RUN_ID="robby-pa-verify-$NOW_TS"
LOG_PREFIX="$RECEIPTS_DIR/$RUN_ID"

mkdir -p "$RECEIPTS_DIR"

log_step() {
  local name="$1"
  local cmd="$2"
  echo "[STEP] $name" | tee -a "$LOG_PREFIX.steps.log"
  echo "> $cmd" | tee -a "$LOG_PREFIX.steps.log"
  bash -lc "$cmd" 1>"$LOG_PREFIX.$name.stdout.log" 2>"$LOG_PREFIX.$name.stderr.log" || return $?
}

pushd "$PKG_DIR" >/dev/null

# 1) Install deps
if ! log_step install "pnpm -C . install"; then
  echo "install:FAIL" > "$LOG_PREFIX.install.json"
else
  echo "install:OK" > "$LOG_PREFIX.install.json"
fi

# 2) Build
if ! log_step build "pnpm -C . build"; then echo "build:FAIL" > "$LOG_PREFIX.build.json"; else echo "build:OK" > "$LOG_PREFIX.build.json"; fi

# 3) Unit tests
UNIT_STATUS="FAIL"
if log_step unit-tests "pnpm -C . test:unit"; then UNIT_STATUS="OK"; fi
echo "unit_tests:$UNIT_STATUS" > "$LOG_PREFIX.unit.json"

# 4) Try to start Postgres via docker compose (optional)
INTEG_STATUS="SKIPPED"
if command -v docker >/dev/null 2>&1; then
  if log_step start-postgres "docker compose -f dev/docker-compose.pg.yml up -d"; then
    # wait for health
    sleep 5
    # Apply migrations
    if log_step migrate "node bin/migrate.cjs"; then
      # 5) Integration tests
      if log_step integration-tests "pnpm -C . test:integration"; then
        INTEG_STATUS="OK"
      else
        INTEG_STATUS="FAIL"
      fi
      # Teardown
      log_step teardown-postgres "docker compose -f dev/docker-compose.pg.yml down"
    else
      INTEG_STATUS="FAIL"
    fi
  else
    INTEG_STATUS="FAIL"
  fi
else
  INTEG_STATUS="SKIPPED"
fi

echo "integration_tests:$INTEG_STATUS" > "$LOG_PREFIX.integration.json"

# 6) Proof Map stub (CLAIMED until integration OK)
PROOF_STATUS="$([ "$INTEG_STATUS" = "OK" ] && echo VERIFIED || echo CLAIMED)"
cat > "$LOG_PREFIX.proof-map.txt" <<EOF
status: $PROOF_STATUS
commands:
  - pnpm -C packages/robby-pa install
  - pnpm -C packages/robby-pa build
  - pnpm -C packages/robby-pa test:unit
  - docker compose -f packages/robby-pa/dev/docker-compose.pg.yml up -d
  - node packages/robby-pa/bin/migrate.cjs
  - pnpm -C packages/robby-pa test:integration
receipts:
  - $LOG_PREFIX.install.json
  - $LOG_PREFIX.build.json
  - $LOG_PREFIX.unit.json
  - $LOG_PREFIX.integration.json
EOF

popd >/dev/null

echo "Robby PA verify complete: $PROOF_STATUS"
echo "Receipts: $RECEIPTS_DIR"
