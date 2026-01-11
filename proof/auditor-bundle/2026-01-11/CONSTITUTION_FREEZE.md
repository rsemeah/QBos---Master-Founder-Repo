# Constitutional Freeze

Date: 2026-01-09
Status: Frozen

## Declaration

Phases 0–5 are **closed** and **frozen**.

- Phase 0 (Truth Serum) — immutable
- Phase 1 (Receipts) — immutable
- Phase 2 (Intent Gates) — immutable
- Phase 3 (Code Generation) — immutable
- Phase 4 (Core Modifications) — immutable architecture; execution-blocked without substrate
- Phase 5 (Constitutional Governance) — immutable specification; implementation requires substrate

## Amendment Requirements

Any change to Phases 0–5 requires:

- Human operator proposal and explicit approval
- External auditor review and explicit approval
- Robby **must abstain** from any vote or approval on constitutional paths

No self-modification of locked zones is permitted. No "temporary bypass" is permitted. No exception process exists outside constitutional amendment.

## Rationale

Freezing the constitution is a signal of maturity, not stasis.

- The architecture demonstrates **power with brakes**
- Execution-blocking is **active** and **correct**
- Governance paths ensure Robby **cannot consolidate power**

Future changes, if any, will be deliberate, auditable, and reversible.

## Enforcement

- Locked zone manifests and Phase 4 gate include self-protection
- CI gates enforce denial on constitutional paths
- Phase 4 requires HSM/Vault, nonce ledger, independent verifier in production
- Phase 5 requires human + auditor approval for amendments

## Closing

QuietBuild OS will not chase velocity over truth.

We built the system that can **say no**.
