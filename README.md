# QuietBuild OS (QBos) — TruthSerum Certified

QuietBuild OS (QBos) is a modular, production-capable platform for reproducible, provable applications. QBos combines orchestration, guided UX, AI reasoning, and a constitutional proof system (TruthSerum) so teams can ship investor-grade demos with auditable evidence.

This monorepo contains engine packages, demo harnesses, proof artifacts, and CI enforcement (TruthGate). Important operations are backed by receipts and verified in CI.

---

## TruthSerum — The Constitutional Layer

TruthSerum evaluates intents, enforces proof requirements, and emits receipts for any high-value claim or state change. Claims without receipts are treated as "Unknown" and blocked or sanitized. CI (TruthGate) enforces that code asserting claims must produce receipts.

Typical flow:
1. Call \`TruthSerum.evaluateIntent(intent, context)\` to discover required proofs.
2. If \`Verified\`, perform the operation.
3. Emit a receipt with \`ReceiptWriter.write({...})\`.
4. CI validates receipts and rejects PRs adding claims without proof.

Example (TypeScript):
\`\`\`ts
import { TruthSerum } from '@qbos/truthserum';
import { ReceiptWriter } from '@qbos/truthserum';

const evaluation = await TruthSerum.evaluateIntent('deploy.ready', context);
if (evaluation.truthState !== 'Verified') {
  throw new Error('Missing required proofs: ' + JSON.stringify(evaluation.missingProofs));
}

// perform operation...

await ReceiptWriter.write({
  sessionId: 'session-123',
  type: 'deploy.completed',
  details: { timestamp: new Date().toISOString(), url: 'https://app.vercel.com' }
});
\`\`\`

Receipt guarantees:
- Session ID and parent-child chaining
- Intent/type, timestamp, actor, and opaque details
- Optional Supabase persistence; local fallback in \`proof/local_receipts.jsonl\`

---

## Core projects & engines

- Robby PA — Personal assistant UI and developer companion for guided builds and confirmations.  
- Rob the Builder — Build automation agent that executes plans and emits receipts for key state changes.  
- BrainSmart — AI reasoning layer used by Robby and other engines for policy-aware suggestions.  
- TruthSerum — Proof & receipt system: all high-value claims and state transitions produce receipts persisted to Supabase (if configured) or local fallback.  
- SilentEngine — Cost/latency-aware AI routing and safe fallback selection.  
- JourneysEngine — Orchestrates multi-step user journeys (onboarding, guided builds, tutorials).  
- IdentityEngine — Authentication, sessions, organizations, and RBAC.  
- SafetyEngine — Centralized safety checks, content filters, and policy enforcement.  
- NotificationsEngine — Email/SMS/push queueing, templating, and delivery retries.  
- EthosEngine — Governance and project-level policy enforcement (brand, legal constraints).  
- SightEngine — Visual quality validator enforcing investor-grade asset standards.  
- ConfigEngine — Feature flags, typed config, and conditional targeting.  
- CharterEngine — Consent management and GDPR/data-rights tooling.  
- PaywallEngine — Plans, entitlements, billing checks, and usage limits.

---

## Why QBos

- Reproducibility — Builds produce receipts proving the steps and artifacts.  
- Verifiability — TruthSerum makes claims auditable; CI TruthGate enforces proofs.  
- Modularity — Engines are independent packages so teams adopt what they need.

---

## Quickstart (developer)

Prereqs: Node.js 18+, pnpm (recommended). Optional: Supabase for persistent receipts.

Minimal local dev:
\`\`\`bash
pnpm install
pnpm --filter apps/proof-harness dev
pnpm --filter packages/truthserum test
\`\`\`

Local notes:
- Local mode writes receipts to \`proof/local_receipts.jsonl\` (no Supabase required).
- To enable Supabase persistence, copy \`.env.production.template\` → \`.env.local\` and set \`SUPABASE_URL\` and \`SUPABASE_SERVICE_KEY\`.

---

## Repo layout (high level)

- \`apps/\` — demo apps (e.g., \`apps/proof-harness\`, \`apps/rob-ui\`).  
- \`packages/\` — engine packages (each with README/tests).  
- \`proof/\` — generated proof artifacts and \`local_receipts.jsonl\` fallback.  
- \`scripts/\` — verification helpers and CI tooling (\`truthgate.ts\`, \`verify-supabase.sh\`).  
- \`.github/workflows/\` — CI including TruthGate.

---

## Working with receipts

- Evaluate intent: \`TruthSerum.evaluateIntent(intent, context)\`.  
- Emit: \`ReceiptWriter.write({ sessionId, type, details })\`.  
- Verify: Use \`verify-receipt.js\` or CI TruthGate scripts to validate receipts and chains.  
- Audit: \`proof/\` contains artifacts for investor review.

See \`packages/truthserum/README.md\` for schema, keystore/migration notes, and verifier tools.

---

## Contributing

- Open issues/PRs; tag engine PRs with \`type:engine\`.  
- Add integration tests to \`apps/proof-harness\`.  
- New claim types must include tests that emit receipts; TruthGate blocks PRs asserting unproven claims.

---

## Security & secrets

- Never commit service keys. Use environment variables and \`.env.production.template\`.  
- Follow \`SECRETS_AND_AUTH_PROMPT.md\` for secrets policy and rotation.

---

## CI & Releases

- TruthGate (GitHub Actions) runs receipt validation and static checks.  
- Releases are automated via workflows; see \`.github/workflows\` and \`scripts\`.

---

## Next steps I can do

- Create a one-page quick reference (badges + minimal run commands).  
- Add a concrete sample receipt and verifier walkthrough to \`packages/truthserum/README.md\`.  
- Open a branch + PR that updates \`README.md\` directly (I can prepare the branch/patch for you).

---

MIT
