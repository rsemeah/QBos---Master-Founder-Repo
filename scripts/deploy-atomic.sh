#!/usr/bin/env bash
set -u

ARTIFACT_DIR="${ARTIFACT_DIR:-proof/_artifacts/06_deploy_verify}"
mkdir -p "$ARTIFACT_DIR"

build_status="skipped"
migration_status="skipped"
deploy_status="skipped"
verify_status="skipped"

{
  echo "[deploy-atomic] starting"
  echo "[deploy-atomic] build"
  if npm run build; then
    build_status="success"
  else
    build_status="failed"
  fi

  echo "[deploy-atomic] migrations"
  if command -v supabase >/dev/null 2>&1; then
    if supabase db reset --debug; then
      migration_status="success"
    else
      migration_status="failed"
    fi
  else
    migration_status="unavailable"
    echo "supabase CLI not available"
  fi

  echo "[deploy-atomic] deploy"
  deploy_status="simulated"
  echo "simulated deploy complete"

  echo "[deploy-atomic] verify"
  verify_status="simulated"
  echo "simulated health check ok"
} 2>&1 | tee "$ARTIFACT_DIR/deploy_run_log.txt"

cat <<JSON > "$ARTIFACT_DIR/verify_results.json"
{
  "build": "${build_status}",
  "migrations": "${migration_status}",
  "deploy": "${deploy_status}",
  "verify": "${verify_status}"
}
JSON
