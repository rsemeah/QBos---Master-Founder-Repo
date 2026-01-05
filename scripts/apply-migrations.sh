#!/bin/bash
set -e

SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-REDACTED_SERVICE_ROLE_KEY}"

echo "Applying database migrations..."

for migration in supabase/migrations/*.sql; do
  echo "Applying $migration..."
  SQL=$(cat "$migration")
  
  curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(jq -Rs . <<< "$SQL")}" \
    || echo "Note: Migration may have already been applied"
  
  echo ""
done

echo "✅ Migrations applied!"
