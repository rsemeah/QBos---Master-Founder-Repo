#!/usr/bin/env bash
set -euo pipefail

# Robby KPI snapshot
# Outputs quick KPIs from git and artifacts for Robby to observe (no changes)

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$(pwd)")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "<no-git>")
LAST_COMMIT=$(git log -1 --pretty=oneline 2>/dev/null || echo "<no-commit>")

echo "repoRoot: ${ROOT}"
echo "branch: ${BRANCH}"
echo "lastCommit: ${LAST_COMMIT}"

echo
echo "--- Activity KPIs ---"
# Active dev days (unique commit dates)
DEV_DAYS=$(git log --date=short --pretty=format:%ad 2>/dev/null | sort -u | wc -l || echo 0)
echo "active_dev_days_total: ${DEV_DAYS}"

# Files touched (last 30 days)
FILES_TOUCHED=$(git log --since="30 days ago" --name-only --pretty=format: 2>/dev/null | sed '/^$/d' | sort -u | wc -l || echo 0)
echo "files_touched_last_30d: ${FILES_TOUCHED}"

# Lines changed last 30 days (added+removed)
LINES_CHANGED=$(git log --since="30 days ago" --pretty=tformat: --numstat 2>/dev/null | awk '{added+=$1; removed+=$2} END {print (added+removed)}' || echo 0)
echo "lines_changed_last_30d: ${LINES_CHANGED}"

echo
echo "--- Verification Trend (artifacts/*.report.json) ---"
if [ -d "artifacts" ]; then
  any=0
  for f in artifacts/*.report.json; do
    [ -f "$f" ] || continue
    any=1
    node - <<NODE "$f"
const fs=require('fs');const path=require('path');
const p=process.argv[1];
try{
  const j=JSON.parse(fs.readFileSync(p,'utf8'));
  console.log(' - file: '+path.basename(p));
  console.log('   generatedAt: '+(j.generatedAt||'<unknown>'));
  console.log('   parsedReceiptsCount: '+((j.inputs&&j.inputs.parsedReceiptsCount)||0));
  console.log('   parseErrorsCount: '+((j.inputs&&j.inputs.parseErrorsCount)||0));
  console.log('   verified: '+((j.truth&&j.truth.verifiedCount)||0)+ ' failed: '+((j.truth&&j.truth.failedCount)||0)+' unknown: '+((j.truth&&j.truth.unknownCount)||0));
}catch(e){ console.log(' - file: '+path.basename(p)+' (invalid JSON)'); }
NODE
  done
  if [ $any -eq 0 ]; then
    echo "  (no report files found)"
  fi
else
  echo "  (no artifacts directory)"
fi

echo
echo "--- Parse error samples (first 20) ---"
node - <<'NODE'
const fs=require('fs');
const p='proof/local_receipts.jsonl';
if(!fs.existsSync(p)){ console.log('no receipts file at '+p); process.exit(0);} 
const lines=fs.readFileSync(p,'utf8').split(/\r?\n/);
let bad=[];
for(let i=0;i<lines.length;i++){ const s=lines[i].trim(); if(!s) continue; try{ JSON.parse(s); }catch(e){ bad.push({line:i+1, sample: s.slice(0,200)}); if(bad.length>=20) break;} }
console.log('bad_lines_count:', bad.length);
for(const b of bad) console.log(' - L'+b.line+': '+b.sample.replace(/\n/g,' '));
NODE

echo
echo "KPI snapshot complete. Use these observability signals for Robby (estimate-only)."
