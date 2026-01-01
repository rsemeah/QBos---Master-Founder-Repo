#!/usr/bin/env bash
set -euo pipefail

# Helper to show and optionally apply the TruthSerum public-key migration
MIGRATION_FILE="supabase/migrations/20251231_add_truthserum_public_key_95c768f8.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "=== TruthSerum public key migration ==="
cat "$MIGRATION_FILE"
echo "======================================"

if [ -n "${PSQL_CONN_STRING:-}" ]; then
  echo "Applying migration via psql (PSQL_CONN_STRING set)"
  psql "$PSQL_CONN_STRING" -f "$MIGRATION_FILE"
  exit 0
fi

if command -v supabase >/dev/null 2>&1 && [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "supabase CLI detected. To apply, run:"
  echo "  supabase db query \"$(sed ':a;N;$!ba;s/"/\"/g' $MIGRATION_FILE)\" --project-ref <ref>"
  exit 0
fi

echo "No automatic runner detected. To apply the migration manually, either:"
echo "  1) Set PSQL_CONN_STRING and rerun this script to apply via psql." 
echo "  2) Use the Supabase UI or CLI to run the SQL above (copy/paste)."

exit 0
