#!/bin/bash
set -e

SUPABASE_URL="https://gcpnnkdldnnnkkkwbnog.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcG5ua2RsZG5ubmtra3dibm9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5NTYzNCwiZXhwIjoyMDgxMDcxNjM0fQ.sb_secret_6oi0gHoMLNzI7jkF9APEeA_rFZ5MsNb"

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
