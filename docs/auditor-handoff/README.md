# Auditor Handoff Bundle (Read-Only)

Contents:

- `../TRANSLATION_TECHNICAL_AUDITOR.md` — technical verification guide
- `../CONSTITUTION_FREEZE.md` — constitutional freeze declaration
- `../WITNESS_PHASE4_EXECUTION_ATTEMPT_YYYY-MM-DD.md` — timestamped witness (generate once via `pnpm run witness:capture`)
- `../AUDITOR_INVITATION.md` — invitation note

Purpose:

Provide a minimal, immutable set of artifacts to test the claim: Phase 4 cannot execute without external cryptographic substrate.

Instructions:

1. Review the technical translation for refusal points and locked zones.
2. Generate the witness once (if not present) using `pnpm run witness:capture`.
3. Examine `ci-artifact/local_receipts.jsonl` for the witness receipt.
4. Attempt to bypass the refusal using configuration changes. Document any successful bypass.

No persuasion. No pitch. Pressure only. Try to prove it wrong.
