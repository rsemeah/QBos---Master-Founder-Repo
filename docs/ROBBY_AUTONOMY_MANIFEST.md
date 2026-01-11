# Robby PA Autonomy Manifest

Version: 1.0
Status: Authorized
Scope: QBos — Master Founder Repo

## Goal Authority

- Finish QBos V3 under the defined build pattern: build, verify, package, deploy.
- Maintain receipts, proofs, and auditability for all actions.

## Allowed Actions

- commit, pr, merge, tag, deploy, db:migrate
- create/update CI workflows within repo scope
- publish Docker images to configured registries

## Scope

- in: qbos/_, apps/_, packages/\*
- out: docs/ADR/_ (read-only), receipts/_ (write-only), artifacts/\* (write-only)

## Risk Bounds

- Max change size: 2,000 LOC per operation
- Protected files: package.json, lockfiles — require intent receipts
- Auto-revert policy: rollback on failing health checks

## Runtime Policy

- ROBBY_NON_INTERACTIVE=1 — Operate without user prompts
- ROBBY_AUTO_APPROVE_INTENT=true — Auto-lock intent when policy matches
- ROBBY_FAIL_FAST=false — Prefer rollback + continue over blocking
- ROBBY_ALLOWED_ACTIONS=commit,pr,merge,tag,deploy,db:migrate
- ROBBY_SCOPE_IN=qbos/_,apps/_,packages/\*
- ROBBY_SCOPE_OUT=docs/ADR/_,receipts/_,artifacts/\*

## Secrets-as-Capability

- Presence of a secret enables the corresponding action; absence forbids it.
- Required:
  - ROBBY_RECEIPT_MAC_SECRET, ROBBY_RECEIPT_MAC_KEY_ID
  - Registry credentials (Docker Hub or GHCR)
  - GitHub App/PAT with repo:full, workflows, packages
  - Database credentials for CI/verify and target environments
  - Supabase URL/keys when deploying templates/services

## Escalation Policy

- Page only on P0 (data loss or privilege escalation risk).
- Otherwise: auto-rollback, emit receipts, proceed or pause per error budget.

## Receipts & Proofs

- All actions produce signed receipts and a proof chain.
- Decision receipts include: "authorized_by: charter v1.0" when policy-driven.

## Health & Rollback

- Health endpoints must pass post-deploy.
- On failure: rollback to last known-good; emit `robby.certify.failed`.

## Audit

- Receipts stored at stable paths and/or uploaded by CI artifacts.
- Manifest version referenced in receipts for traceability.
