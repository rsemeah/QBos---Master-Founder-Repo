# PR: Add Robby Autonomy Manifest & Non-Interactive Operation Mode

## Summary

Enables Robby PA to complete QBos V3 build, verify, package, and deploy operations **without human approval or consent prompts**, governed by an explicit autonomy charter.

This PR transforms Robby from an interactive assistant into a policy-driven autonomous agent suitable for CI/CD and hands-off production workflows.

---

## What Changed

### 🔐 Autonomy Charter (New)

- **File:** `docs/ROBBY_AUTONOMY_MANIFEST.md`
- **Purpose:** Constitutional authority document defining allowed actions, scope, risk bounds, rollback policy, and secrets-as-capability model
- **Key Provisions:**
  - Allowed actions: commit, pr, merge, tag, deploy, db:migrate
  - Scope in: `qbos/*`, `apps/*`, `packages/*`
  - Scope out: `docs/ADR/*` (read-only), `receipts/*` (write-only)
  - Auto-rollback on health check failures
  - P0-only escalation policy

### 🤖 Non-Interactive Mode Wiring

#### Apps/Robby (Intent Auto-Approval)

- **File:** `apps/robby/src/core/sessionManager.ts`
- **Change:** When `ROBBY_AUTO_APPROVE_INTENT=true|1`, intent is auto-locked with `approvedBy: policy` upon submission
- **Effect:** No human approval gate; receipts show policy-driven decisions

#### Apps/Proof-Harness (Consent Bypass)

- **File:** `apps/proof-harness/app/api/rob/init/route.ts`
- **Change:** When `ROBBY_NON_INTERACTIVE=1|true`, consent is pre-granted and "I consent" prompt is replaced with non-interactive notice
- **Effect:** Rob sessions initialize without user confirmation

#### Packages/Robby-PA (Server Auto-Lock)

- **File:** `packages/robby-pa/src/server.ts`
- **Change:** On session creation, if `ROBBY_AUTO_APPROVE_INTENT=true|1`, immediately transitions to `INTENT.locked` and emits `intent.locked` receipt with `by: policy`
- **Effect:** Server-side sessions bypass approval flow when policy allows

### 🔄 CI Enforcement

- **Files:**
  - `.github/workflows/robby-pa-verify.yml`
  - `.github/workflows/qbos-verify.yml`
- **Change:** Added `ROBBY_NON_INTERACTIVE=1` and `ROBBY_AUTO_APPROVE_INTENT=true` to CI env
- **Effect:** CI verify workflows run without blocking on consent or approval gates

---

## Runtime Flags

| Flag                        | Values      | Purpose                                                   |
| --------------------------- | ----------- | --------------------------------------------------------- |
| `ROBBY_NON_INTERACTIVE`     | `1`, `true` | Bypass consent prompts; operate without user confirmation |
| `ROBBY_AUTO_APPROVE_INTENT` | `true`, `1` | Auto-lock intent and proceed when policy allows           |
| `ROBBY_FAIL_FAST`           | `false`     | (Optional) Prefer rollback over blocking on errors        |
| `ROBBY_ALLOWED_ACTIONS`     | CSV         | (Optional) Filter allowed actions                         |
| `ROBBY_SCOPE_IN`            | CSV         | (Optional) Whitelist paths                                |
| `ROBBY_SCOPE_OUT`           | CSV         | (Optional) Blacklist paths                                |

---

## Verification Receipts

### Intent Auto-Approval

- **Receipt Type:** `intent.locked`
- **Payload:** `{ approvedBy: 'policy' }`
- **Emitted By:** `sessionManager.lockIntent()` when `ROBBY_AUTO_APPROVE_INTENT=true`

### Session Initialization

- **Receipt Type:** `session.created`
- **Modified Behavior:** When `ROBBY_NON_INTERACTIVE=1`, `consent_granted` defaults to `true`

### CI Verification

- **Artifacts:** `robby-pa-receipts-{run_id}-{run_attempt}`
- **Upload Path:** `packages/robby-pa/receipts/runs/{run_id}-{run_attempt}`
- **Validation:** CI fails if receipts aren't signed or proof chain breaks

---

## Secrets Required

- `ROBBY_RECEIPT_MAC_SECRET` — Receipt signing key (already configured)
- `ROBBY_RECEIPT_MAC_KEY_ID` — Key identifier (e.g., `robby-v1-primary`)
- GitHub PAT/App with `repo:full`, `workflows`, `packages`
- Registry credentials (Docker Hub or GHCR)
- Database credentials for CI Postgres service
- Supabase URL/keys (when deploying templates)

---

## Testing

### Local Non-Interactive Init

```bash
export ROBBY_NON_INTERACTIVE=1
pnpm -w --filter apps/proof-harness dev
# Visit http://localhost:3000 — consent pre-granted
```

### Robby PA Auto-Approval

```bash
export ROBBY_AUTO_APPROVE_INTENT=true
pnpm -C packages/robby-pa dev
# Create session via API — intent auto-locks
```

### CI Workflow

- CI automatically uses non-interactive mode
- Verify receipts in uploaded artifacts post-run

---

## Checklist

- [x] Autonomy manifest created and versioned
- [x] Non-interactive consent bypass wired
- [x] Intent auto-approval implemented (apps/robby)
- [x] Intent auto-lock wired (packages/robby-pa)
- [x] CI workflows updated with flags
- [ ] Confirm CI run produces valid receipts
- [ ] Optional: Wire manifest version into receipts for traceability

---

## Notes

- **Autonomy ≠ Chaos:** All actions remain auditable via receipts; rollback policy enforces safety bounds
- **Secrets-as-Capability:** Presence of a secret enables action; absence forbids it
- **P0 Escalation Only:** Robby continues autonomously unless data loss or privilege escalation risk detected
