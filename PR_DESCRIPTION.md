PR: Finalize TruthSerum keys, migration, scripts, and CI

Summary
- Adds Supabase migration to register TruthSerum public key (95c768f8...)
- Adds scripts to generate keys, verify receipts, and apply migration
- Adds `verify-latest.sh` helper and `verify-receipt.js` verification tool
- Adds GitHub Actions CI workflow `truthserum-ci.yml` to run smoke tests and verification

Files of interest
- supabase/migrations/20251231_add_truthserum_public_key_95c768f8.sql
- scripts/generate-truthserum-keys.sh
- scripts/verify-latest.sh
- scripts/smoke-truthserum.js
- verify-receipt.js
- .github/workflows/truthserum-ci.yml

Secrets required for CI
- TRUTHSERUM_PRIVATE_KEY_PEM_BASE64
- TRUTHSERUM_PUBLIC_KEY_PEM_BASE64
- (optional) SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for DB verification

Checklist
- [ ] Confirm CI secrets set
- [ ] Merge migration in controlled window
- [ ] Confirm Supabase `truthserum_public_keys` table exists and RLS allows inserts by service role
- [ ] Verify CI run produces `verified: true` for latest receipt

Notes
- The CI workflow performs an ephemeral smoke run and uploads `proof/local_receipts.jsonl` as an artifact for audit.
