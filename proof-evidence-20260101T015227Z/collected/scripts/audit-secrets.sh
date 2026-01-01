#!/usr/bin/env bash
set -euo pipefail

echo "Running basic secrets audit (grep)"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not a git repo"; exit 1; }

# Patterns to find likely secrets (conservative)
PATTERNS=('API_KEY' 'APIKEY' 'SECRET' 'PRIVATE_KEY' 'SERVICE_ROLE' 'SUPABASE' 'OPENAI' 'VERCEL' 'CLAUDE' 'GEMINI' 'SK-' 'pk_')

for p in "${PATTERNS[@]}"; do
  echo "--- Searching for: $p ---"
  git grep -n --heading -I -E "$p" || true
done

echo "Audit complete. Review matches above and rotate any exposed keys." 
