# VSC HANDOFF — ROBBY PA MVA (SCOPE-LOCKED, TRUTHSERUM-CLEAN)

**Date:** 2026-01-10
**Repo:** QuietBuild OS
**Target Location:** `packages/robby-pa/`
**Mission:** Bring Robby PA from **SCAFFOLD/CLAIMED → VERIFIED (runtime)** by implementing the MVA spec **exactly** (no additions).
**Absolute Rule:** If it’s not explicitly in the spec, mark `OUT_OF_SCOPE` and do not implement.

---

## 0) TRUTH STATE (DO NOT CHANGE THIS LANGUAGE)

### Current Reality (Verified)

* The repo contains **documentation + partial scaffold** for Robby PA.
* There is **no validated proof bundle** that compilation/tests/API/runtime have passed for `packages/robby-pa` end-to-end.

### Current Status

**🟡 STATUS: CLAIMED**
Meaning: some code/docs exist; **runtime proofs are missing**.

> You may only upgrade status to VERIFIED after you produce reproducible command output that shows build + tests passing for `packages/robby-pa`.

---

## 1) PRIMARY BLOCKER (WHAT MUST BE FIXED FIRST)

We have a “two worlds” problem:

* Documentation describes **full MVA architecture** (`core/`, `verification/`, `api/`, etc.)
* The repo appears to also have a **minimal scaffold** layout (`src/receipt.ts`, `inMemoryStore.ts`, `bin/robby-pa.cjs`)

### Your first deliverable is to make `packages/robby-pa/` a single coherent package

* Either match the **full MVA folder structure** from the spec, **or**
* If the repo standard is `src/`, then map the modules inside `src/` cleanly (but still preserve separation)

**Do not keep both patterns. Pick one and unify.**

---

## 2) SCOPE (MVA ONLY — MUST IMPLEMENT)

Deliver working lifecycle:

`INTENT → EXECUTION → VERDICT`

Must implement:

* Deterministic decision engine
* Resumable bounded autonomy loop
* Postgres persistence (sessions/receipts/artifacts/proofs/snapshots)
* Receipt writer + verifier (MAC + chain + artifact refs) fail-closed
* HARD proof registry + verifier (4 proof types only)
* Minimal adapters: Silent + Execution
* API endpoints for full lifecycle
* UX mapper (construction theme; never surface “BLOCKED/ERROR”)
* Cost guards + rate limits + minimal caching
* Unit tests + 1 E2E test

Explicitly OUT OF SCOPE:

* Any additional adapters
* Soft proofs
* Real deployment
* UI polish beyond strings
* Engine contract changes
* Anything not written in the spec

---

## 3) NON-NEGOTIABLES (ENFORCE IN CODE)

* No claim without receipts/proofs.
* Receipts append-only, chained, signed, verified fail-closed.
* Never surface “BLOCKED” or “ERROR” in UX strings.
* Retry policy bounded: attempt 1 → retry → pivot → pause-for-inspection.
* Cost caps enforced (session + org).
* Engines are sovereign: adapters only.

---

## 4) REQUIRED FOLDER STRUCTURE (FINAL)

Create/adjust in `packages/robby-pa/`:

```text
packages/robby-pa/
  core/
  engines/
  persistence/
  verification/
  api/
  types/
  __tests__/
  docs/
  package.json
  tsconfig.json
  README.md
```

If repo conventions force `src/`, you may place those folders inside `src/` as long as:

* separation is preserved
* imports remain stable
* tests run against the final structure

---

## 5) API ROUTES (MUST EXIST)

Required endpoints:

* POST `/api/v1/sessions`

* POST `/api/v1/sessions/:id/message`

* GET  `/api/v1/sessions/:id/intent`

* POST `/api/v1/sessions/:id/approve`

* POST `/api/v1/sessions/:id/execute`

* GET  `/api/v1/sessions/:id/status`

* GET  `/api/v1/sessions/:id/tasks`

* GET  `/api/v1/sessions/:id/verdict`

* POST `/api/v1/sessions/:id/accept`

* POST `/api/v1/sessions/:id/reject`

* GET  `/api/v1/sessions/:id/receipts`

* GET  `/api/v1/sessions/:id/artifacts`

* GET  `/api/v1/artifacts/:artifactId`

* POST `/api/v1/sessions/:id/cancel`

* POST `/api/v1/sessions/:id/delete_destroy`

* POST `/api/v1/sessions/:id/snapshots`

* POST `/api/v1/sessions/:id/fork`

Auth:

* Supabase JWT or API key (org-scoped)
* Admin key for `delete_destroy`

---

## 6) VERIFICATION REQUIREMENT (HOW YOU EARN “VERIFIED”)

### You MUST produce reproducible proof by running

From repo root:

```bash
pnpm -C packages/robby-pa install
pnpm -C packages/robby-pa build
pnpm -C packages/robby-pa test
```

Minimum passing criteria:

* TypeScript compiles
* Unit tests pass
* 1 E2E integration test passes (session → message → approve → execute → verdict)
* Hard proofs are validated in the E2E flow

You are NOT required to make:

* apps/robby Next.js build succeed
  That is OUT_OF_SCOPE unless it blocks `packages/robby-pa` tests.

---

## 7) DATABASE (POSTGRES REQUIRED — NO IN-MEMORY IN PROD PATH)

* In-memory store allowed only for unit tests.
* Production code path must use Postgres stores.
* Provide migration SQL in `packages/robby-pa/sql/` or equivalent.

---

## 8) DELIVERABLES (WHAT TO RETURN)

You must return:

1. **Changelog** of files created/modified
1. **How to run locally** (exact commands)
1. **How to run tests**
1. **Proof Map** (TruthSerum format):

```text
claim → receipt ids → proof ids → artifact sha256
```

1. Remaining **UNKNOWNs** (explicit)

---

## 9) DO NOT DO THESE (FAIL CONDITIONS)

* Don’t claim “VERIFIED” without command output.
* Don’t add “nice-to-have” features.
* Don’t wire extra engines.
* Don’t add UI.
* Don’t implement real deployment.
* Don’t change contracts in other packages.

---

## 10) FIRST TASK (DO THIS IMMEDIATELY)

Before coding anything, run from repo root and paste the output:

```bash
ls -la packages/robby-pa || true
find packages/robby-pa -maxdepth 3 -type f | sort
cat packages/robby-pa/package.json 2>/dev/null || true
```

This establishes what exists and prevents hallucinated structure.

---

## END HANDOFF

**Goal:** Clean, scope-locked Robby PA package at `packages/robby-pa/` with build + tests passing and a Proof Map.
**Status remains 🟡 CLAIMED until runtime evidence exists.**
