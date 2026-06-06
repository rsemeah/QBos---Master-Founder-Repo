# Phase Rules
*The RedLantern build lifecycle. Every feature. Every time.*

---

## The 9 Phases

### Phase 1 — INTAKE
**What:** Capture the request, context, and desired outcome.
**Who:** Rory / PM
**Exit criteria:** INTAKE_RECEIPT.md written with problem, requester, solution, repo, priority, deadline
**Blocked by:** No problem statement, no repo identified

### Phase 2 — SCOPE_LOCK
**What:** Define exact boundaries — which files, tables, agents, tests
**Who:** PM / Robby
**Exit criteria:** SCOPE_LOCK_RECEIPT.md written. Rory approves.
**Blocked by:** Scope unclear, missing file list, missing done state

### Phase 3 — PLAN
**What:** Decide implementation approach, data contracts, AI contracts, risk
**Who:** PM + DESIGN + BACKEND
**Exit criteria:** PLAN_RECEIPT.md written. Stories have AC and DoD. State maps done.
**Blocked by:** Missing data contract, missing AI IO contract if AI involved

### Phase 4 — EXECUTE
**What:** Agents build only the approved scope
**Who:** FRONTEND + BACKEND + DESIGN
**Exit criteria:** EXECUTION_RECEIPT.md written. TypeScript clean. Build passes.
**Blocked by:** Scope creep detected, protected file touched without approval

### Phase 5 — PROVE
**What:** Tests pass, security clean, QA validates user reality
**Who:** REVIEW + QA + CI
**Exit criteria:** PROOF_RECEIPT.md. CI green. REVIEW: PASS. QA: PASS. Security: CLEAN.
**Blocked by:** CI fail, REVIEW: REJECT, QA: FAIL, secret detected, RLS missing

### Phase 6 — HANDOFF
**What:** Summarize what changed, what didn't, what to watch
**Who:** RUNTIME / PM
**Exit criteria:** HANDOFF_RECEIPT.md. Rory has reviewed summary.
**Blocked by:** Unresolved FLAGS from REVIEW

### Phase 7 — SHIP
**What:** Merge to main, deploy, confirm production
**Who:** DEPLOY
**Exit criteria:** SHIP_RECEIPT.md. Production URL confirmed. Rollback plan written.
**Blocked by:** No preview tested, no rollback plan, CI failing on main

### Phase 8 — OBSERVE
**What:** Watch PostHog, Sentry, AI runs, logs for 24 hours post-ship
**Who:** OBSERVE
**Exit criteria:** OBSERVE_RECEIPT.md. No critical errors. Metric movement noted.
**Blocked by:** Sentry errors with no fix plan, AI output quality degradation

### Phase 9 — IMPROVE
**What:** Capture lessons, update QBos templates, update agent contracts
**Who:** Rory / PM / Claude
**Exit criteria:** LESSON_RECEIPT.md. Lesson Ledger updated.
**Blocked by:** Nothing (async, never blocks next feature)

---

## Phase Sequence Lock

Phase N+1 cannot begin while Phase N has an unresolved blocker.
Exception: IMPROVE runs in parallel with future features.
