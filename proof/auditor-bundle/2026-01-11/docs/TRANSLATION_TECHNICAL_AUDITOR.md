# QuietBuild OS — Technical Auditor View

This document summarizes how QuietBuild OS enforces refusal, locks constitutional paths, and prevents replay/escalation. It is designed for security engineers and auditors to verify the guarantees quickly.

## Locked vs Unlocked Zones

- Locked zones are hard-denied at the Phase 4 gate with self-protection (the gate file is itself locked). Attempting to touch a locked path triggers abort.
- Unlocked zones require dual-key approval, unique nonces, and independent verification.

See manifests:

- Locked: `docs/LOCKED_ZONES_MANIFEST.md`
- Unlocked: `docs/UNLOCKED_ZONES_MANIFEST.md`

Gate enforcement source: `packages/engines/execution-engine/core/src/permissions/RobbyPhase4CoreModificationGate.ts`

## Refusal Enforcement (Production)

Phase 4 refuses to configure/execute without substrate. Blocking conditions:

- `PRODUCTION_KEYS_REQUIRED` — Dev keys in production; HSM/Vault custody required.
  - Source: `packages/engines/execution-engine/core/src/permissions/Phase4DualKeyApprovalSystem.ts` (constructor)
- `HSM_VAULT_REQUIRED` / `HSM_ENDPOINT_REQUIRED` — HSM enabled but not configured.
  - Source: same as above
- `NONCE_REGISTRY_REQUIRES_LEDGER` — Local JSONL registry in production; append-only ledger required.
  - Source: `packages/engines/execution-engine/core/src/receipts/NonceRegistry.ts` (constructor)
- `NONCE_LEDGER_CONFIG_REQUIRED` — Missing ledger configuration in production.
  - Source: same as above
- `VERIFICATION_CANNOT_BE_DISABLED` — Independent verification cannot be disabled in production.
  - Source: `packages/engines/execution-engine/core/src/steps/Phase4CoreModificationStep.ts` (constructor)
- `INDEPENDENT_VERIFIER_REQUIRED` — No verifier endpoint configured in production.
  - Source: same as above

Acceptance criteria and examples: `docs/PHASE4_EXECUTION_BLOCKED_ACCEPTANCE.md`

## Replay/Monotonicity and Escalation Prevention

- Nonce format: `{timestamp_ms}_{counter}_{random_32_bytes}`
- Prevents replay: duplicate nonces rejected (`NONCE_REUSE_DETECTED`)
- Enforces monotonicity: counters must not decrease (`NONCE_NOT_MONOTONIC`)
- Append-only persistence: local JSONL in dev; ledger required in prod
- Abort triggers: touching locked paths, nonce anomalies, kill switch

Source: `packages/engines/execution-engine/core/src/receipts/NonceRegistry.ts`

## Witness Procedure

Run the documented witness script to observe refusal and generate an append-only receipt:

- Doc: `docs/WITNESS_PHASE4_EXECUTION_ATTEMPT.md`
- Script: `scripts/witness-phase4-execution-attempt.ts`
- NPM script: `pnpm run witness:phase4`

Expected: exact blocking error printed; receipt appended to `ci-artifact/local_receipts.jsonl`; clean halt.

## Verification Steps (Local)

1. Inspect locked lists and gate code paths.
2. Run the witness script in production mode.
3. Confirm refusal error and receipt emission.
4. Attempt to configure missing components one-by-one (HSM, ledger, verifier) and verify that all requirements must be satisfied before execution.

## CI/Operational Signals

- CI gates deny changes to constitutional files.
- Phase 4 gate exposes `kill switch` and abort state; once triggered, all Phase 4 operations halt until reset through governance.
- Receipts: Phase 4 operations write structured receipts (proposal, approval, nonce, apply, verification, rollback/abort).

## Auditor Questions to Ask

- Can any actor write to locked zones? (Should be no.)
- Can Phase 4 run in production without all three substrates? (Should be no.)
- Is refusal observable and logged? (Witness script + receipts.)
- Can Robby approve its own constitutional changes? (Should be no; Phase 5 requires human + auditor; Robby abstains.)
