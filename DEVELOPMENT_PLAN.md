Overview

I'll lead the remaining work to finalize TruthSerum + SilentEngine automation. Below are concrete tasks I'll implement in order. I'll make changes in this repo (branches, files, CI scaffolding) so you can review and merge.

Priority tasks (what I'll do now)

1) Prepare PR skeleton
- Include migration (already added), helper scripts, verify tool improvements, and a short PR description.
- Branch name: `truthserum/finalize-keys-and-ci`

2) Add CI workflow (GitHub Actions)
- Run `node scripts/smoke-truthserum.js` and `./scripts/verify-latest.sh` on push to the branch and on PR.
- CI will require repository secrets: `TRUTHSERUM_PRIVATE_KEY_PEM_BASE64`, `TRUTHSERUM_PUBLIC_KEY_PEM_BASE64`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

3) Add SilentEngine config (automation plan)
- Create `.silentengine/config.yml` describing autonomous steps: keygen (optional), apply migration (dry-run), run smoke tests, post receipts to Supabase.

4) Add tests
- Unit test for sign/verify roundtrip in `packages/truthserum/test/`.

5) Docs and runbook
- Add `docs/TRUTHSERUM_RUNBOOK.md` with key lifecycle, how to rotate keys, how to apply migration to Supabase, and how to interpret receipts.

6) Verification artifact
- Produce `proof/truthserum_verification_receipt.json` that records the verified receipt id, computed key id, timestamp, and CI run id.

7) Open PR
- Prepare branch, commit, and push (you can push or I can output the exact `git` steps). Open a PR with description and checklist.

Notes and constraints
- I cannot push to your remote or run CI on your account without credentials. I'll create all files and instructions and a CI workflow that will run when you push the branch.
- Secrets must be added to GitHub Actions secrets or supplied in the environment for CI to sign and verify using real keys.

Next immediate actions (I'll perform now):
- Add GitHub Actions workflow file at `.github/workflows/truthserum-ci.yml` (scaffold).
- Add a `PR_DESCRIPTION.md` describing the PR contents.

If you prefer I also prepare a `git` command snippet to create the branch and commit everything, tell me and I'll include it in the PR_DESCRIPTION.
