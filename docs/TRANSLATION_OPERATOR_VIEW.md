# QuietBuild OS — Operator/Founder View: Honesty Guarantees

QuietBuild is built to refuse power when the truth is uncertain. It will stop instead of guessing, and it will tell you why.

## What You Can Rely On

- Stops instead of guessing: In production, Phase 4 refuses to run without HSM/Vault, nonce ledger, and independent verifier.
- Full auditability: Every operation writes receipts; you can trace what happened and why.
- Clean halting: When refusal occurs, the system halts without side effects, and the refusal is logged.
- No silent bypass: There is no temporary mode, no hidden flag; constitutional paths cannot be changed by Robby.

## How to See It

- Run the witness artifact: `pnpm run witness:phase4`
- Read the witness doc: `docs/WITNESS_PHASE4_EXECUTION_ATTEMPT.md`
- Inspect receipts: `ci-artifact/local_receipts.jsonl` (append-only)

You will see an explicit error like `PRODUCTION_KEYS_REQUIRED` or `NONCE_REGISTRY_REQUIRES_LEDGER` and a receipt documenting the refusal.

## Why It Matters

Most systems try to look powerful. QuietBuild tries to be honest.

- It won't bluff its way through missing safeguards.
- It tells you exactly what's needed before it acts.
- You keep control: Robby cannot approve changes to its own constraints.

## Your Role

- Approve intents: Robby proposes; you approve.
- Approve constraints: Any constitutional change requires your approval and an external auditor.
- Read receipts: Treat the receipt log as your source of truth.

## The Promise

QuietBuild is infrastructure for people who care about truth, failure, and control. It earns trust by refusing power when it shouldn't have it.
