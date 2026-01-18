Robby approvals and receipts

This directory contains registry, policies and receipts used by the Robby runtime guard.

- `REGISTRY/actions.v1.json` — action registry; required for `ActionGuard` to recognize actions.
- `POLICIES/` — policy packs referenced by the guard.
- `receipts/` — receipts written by the guard (`action.requested`, `action.allowed`, `action.denied`).

Maintainers:

- To add a Noor approval, place a receipt with `approval.intent` in `.robby/receipts` or use the UI.
- CI validates that PRs touching `.robby/` include receipts via `.github/workflows/validate-robby-receipts.yml`.
