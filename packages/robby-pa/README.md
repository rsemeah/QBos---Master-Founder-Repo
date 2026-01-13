# Robby PA - Autonomous Build Conductor (MVA Release)

**Status**: 🟡 CLAIMED — subset ✅ VERIFIED
(build + unit tests executed 2026-01-08)
**Version**: 1.0.0-mva
**Last Updated**: January 8, 2026
**TruthSerum Status**: See
[TRUTHSERUM_PROOF_BUNDLE.md](./TRUTHSERUM_PROOF_BUNDLE.md) for receipts
and evidence.

## What is Robby PA?

**Robby PA is** an autonomous agent that conducts build operations with
constitutional enforcement via TruthSerum. The system manages the
INTENT→EXECUTION→VERDICT state machine, records tamper-evident receipts,
and captures HARD proofs of completion. Build + unit tests now executed;
integration/API/DB receipts remain pending (see proof bundle).

## Quick Start

```bash
pnpm install
pnpm dev
```

Then POST to `/api/robby/sessions`:

```bash
curl -X POST http://localhost:3001/api/robby/sessions \
  -H "Authorization: Bearer your-jwt" \
  -H "Content-Type: application/json" \
  -d '{"intent": "Build my Next.js app"}'
```

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Routes (create, status, messages, approve, stop)     │  │
│  │ Auth Middleware (JWT validation)                     │  │
│  │ Cost Guard (budget enforcement)                      │  │
│  │ Rate Limit (60/min, 1000/hour per org)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                Autonomy Loop                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Observe (read current state)                         │  │
│  │ Decide (DecisionEngine → next action)                │  │
│  │ Act (execute action, update state)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ↓                          ↓                  ↓
      ┌────────────────┐    ┌────────────────┐   ┌────────────────┐
      │ SilentEngine   │    │ExecutionEngine │   │ TruthSerum     │
      │                │    │                │   │ Guard          │
      │ • Clarify      │    │ • Execute      │   │                │
      │ • Plan         │    │ • Capture      │   │ • Detect claims│
      │ • Pivot        │    │   artifacts    │   │ • Verify proofs│
      └────────────────┘    └────────────────┘   │ • Rewrite msgs │
                                                  └────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│            Persistence & Verification                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Stores (Session, Receipt, Artifact, Proof)          │  │
│  │ Verifiers (MAC, Chain, Proofs)                       │  │
│  │ Registry (MAC Keys with key rotation)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  PostgreSQL (tamper-evident receipts + chain)               │
└─────────────────────────────────────────────────────────────┘
```

## State Machine

### INTENT Phase

```text
CLARIFYING → READY_TO_PLAN → AWAITING_APPROVAL → APPROVED → (move to EXECUTION)
   ↑                                                ↓
   ├─────────────────────PIVOTING←────────────────┘
```

### EXECUTION Phase

```text
RUNNING → CAPTURING_ARTIFACTS → (move to VERDICT)
  ↓           ↓
RETRYING  FAILED (→ VERDICT:REJECTED)
```

### VERDICT Phase

```text
VERIFYING_PROOFS → ACCEPTED or REJECTED (terminal)
```

## Cost Limits (HARD Enforced)

| Resource | Limit | Enforcement |
| --- | --- | --- |
| Tokens | 100,000 | CostGuard |
| Cost | $2.00 USD | CostGuard |
| Duration | 20 minutes | CostGuard |
| Retries | 2 | DecisionEngine |
| Concurrent/Org | 3 sessions | CostGuard |

## File Structure

```text
packages/robby-pa/
├── core/
│   ├── types.ts              # Type system (phases, states, receipts, proofs)
│   ├── state-machine.ts      # Transition validation
│   ├── ux-mapper.ts          # Status → user message (construction theme)
│   ├── decision-engine.ts    # Observe→Decide→Act logic
│   └── autonomy-loop.ts      # Resumable, bounded runner
├── persistence/
│   ├── postgres.ts           # Connection pool
│   ├── session-store.ts      # Session CRUD + state validation
│   ├── receipt-store.ts      # Receipt persistence + chain enforcement
│   ├── artifact-store.ts     # Artifact storage + SHA-256 verification
│   └── proof-store.ts        # Proof recording + result tracking
├── verification/
│   ├── key-registry.ts       # MAC key management
│   ├── receipt-verifier.ts   # MAC + chain + artifact verification
│   ├── proof-verifier.ts     # HARD proof validation
│   └── truthserum-guard.ts   # Claim detection + rewriting
├── engines/
│   ├── silent-adapter.ts     # LLM calls (clarify, plan, pivot)
│   └── execution-adapter.ts  # Sandboxed build execution
├── api/
│   ├── routes.ts             # All MVA endpoints
│   ├── auth-middleware.ts    # JWT validation
│   ├── cost-guard.ts         # Budget enforcement
│   └── rate-limit.ts         # Per-org rate limiting
├── docs/
│   ├── COST_MODEL.md         # Budget breakdown
│   └── OPERATIONS.md         # Env vars, endpoints, monitoring
├── __tests__/
│   ├── state-machine.test.ts # State transition tests
│   ├── receipt-verifier.test.ts
│   ├── decision-engine.test.ts
│   └── e2e.integration.test.ts
├── index.ts                  # Express server entrypoint
├── cli.ts                    # Session management CLI
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

## HARD Proofs (MVA Only)

Robby PA captures 4 HARD proofs during execution:

1. **receipt.mac.verified** - HMAC-SHA256 signature validates
2. **receipt.chain.verified** - Receipt chain is unbroken
3. **artifact.sha256.verified** - Artifact hash matches expected
4. **execution.exit_code.zero** - Build command succeeded (exit code 0)

All other claims are rewritten by TruthSerum to "not yet verified" or similar.

## Receipt Format (Tamper-Evident)

```json
{
  "id": "receipt_1610000000_abc123",
  "session_id": "session_xyz",
  "seq": 1,
  "type": "session.created",
  "phase": "INTENT",
  "state": "CLARIFYING",
  "keyId": "robby-v1",
  "hash": "sha256(receipt_data)",
  "mac": "hmac-sha256(hash, secret_key)",
  "prev_hash": null,
  "artifact_refs": [],
  "cost_tokens": 0,
  "cost_usd": 0.0,
  "metadata": { },
  "created_at": "2026-01-10T12:00:00Z"
}
```

Chain is verified: `receipt[n].prev_hash === receipt[n-1].hash`

## API Endpoints

### Sessions

```text
POST   /api/robby/sessions                  Create session
GET    /api/robby/sessions/:sessionId       Get status
POST   /api/robby/sessions/:sessionId/messages   Send message
POST   /api/robby/sessions/:sessionId/approve    Approve plan
POST   /api/robby/sessions/:sessionId/stop       Stop session
```

### Receipts & Proofs

```text
GET    /api/robby/sessions/:sessionId/receipts  List receipts
GET    /api/robby/sessions/:sessionId/proofs    List proofs
```

### Health

```text
GET    /api/robby/health    Server health check
```

## Implementation Checklist

- ✅ Type system (phases, states, receipts, proofs, artifacts)
- ✅ State machine with bounded retry/pivot
- ✅ UX mapper (construction site theme)
- ✅ PostgreSQL persistence layer
- ✅ Key registry (deterministic keyId, rotation support)
- ✅ Receipt verifier (MAC + chain + artifacts)
- ✅ Proof verifier (HARD proofs only)
- ✅ TruthSerum guard (claim detection + rewriting)
- ✅ Session store (with state transition validation)
- ✅ Artifact store (with SHA-256 verification)
- ✅ Receipt store (with chain enforcement)
- ✅ Proof store (with result tracking)
- ✅ Decision engine (observe→decide→act)
- ✅ Autonomy loop (resumable, bounded, crash-safe)
- ✅ Engine adapters (SilentEngine, ExecutionEngine)
- ✅ Cost guard (token, cost, time, concurrency limits)
- ✅ Rate limiter (60/min, 1000/hour per org)
- ✅ API routes (all endpoints)
- ✅ Auth middleware (JWT validation)
- ✅ Unit tests (state machine, receipt verifier, decision engine)
- ✅ E2E test (full autonomous flow)
- ✅ Documentation (cost model, operations guide)
- ✅ CLI tool (session management)

## Next Steps (Post-MVA)

See [HANDOFF_MVA.md](./HANDOFF_MVA.md) for complete specification including:

- Engine implementations
- Advanced features
- Scale-up roadmap
- Production hardening

## Configuration

See [docs/OPERATIONS.md](./docs/OPERATIONS.md) for:

- Environment variables
- API examples
- Monitoring queries
- Troubleshooting
- Backup/recovery

## Cost Estimates

Typical session:

```text
Clarify:   $0.01 (500 tokens)
Plan:      $0.02 (1,000 tokens)
Execute:   $0.50 (variable)
Verify:    $0.00 (local computation)
──────────────────────
Total:     $0.53 (well under $2.00 limit)
```

See [docs/COST_MODEL.md](./docs/COST_MODEL.md) for detailed breakdown.

## Contributing

- All code must follow MVA scope (no feature expansion)
- All changes must maintain constitutional invariants
- All PRs must include receipts (tests + cost analysis)
- All user-facing messages must be TruthSerum-guarded

## Status & Verification

**Current Status**: 🟡 CLAIMED (runtime not yet verified)

This implementation has been built and unit tests executed;
**integration/API/DB runtime receipts are pending**. To upgrade from
CLAIMED → VERIFIED:

See:

- **[TRUTHSERUM_PROOF_BUNDLE.md](./TRUTHSERUM_PROOF_BUNDLE.md)** — Evidence
inventory (what's verified, what requires execution)
- **[IMPLEMENTATION_CLAIMED.md](./IMPLEMENTATION_CLAIMED.md)** —
TruthSerum-compliant status assessment
- **[VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)** — Step-by-step how
to gather runtime evidence

## License

MIT

- ✅ Cost controls & circuit breakers
- ✅ Strategic guardrails

**Timeline:** 3-4 weeks with 1-2 engineers  
**Cost:** $25-35/month for 100 users (optimized)  
**LOC:** ~2,200 lines production code

---

## 🚀 Quick Start (Current Scaffold)

```bash
# Set MAC secret then run demo
export ROBBY_RECEIPT_MAC_SECRET="your-secret"
node packages/robby-pa/bin/robby-pa.cjs
```

---

## 📁 Current Files

- `src/receipt.ts` - TypeScript implementations for create/verify receipts
- `src/store/inMemoryStore.ts` - in-memory store for local tests
- `sql/001_init.sql` - Postgres migration per spec
- `bin/robby-pa.cjs` - small demo runner (CommonJS)

---

## 🎯 Implementation Status

Current scaffold includes:

- ✅ Basic receipt creation (MAC signing)
- ✅ 3-phase state machine definition
- ✅ PostgreSQL schema
- ✅ Task orchestrator with retry logic
- ✅ In-memory stores

**Required for MVA** (see HANDOFF_MVA.md):

- ⚠️ Receipt verification (MAC + chain + artifact refs)
- ⚠️ PostgreSQL stores (replace in-memory)
- ⚠️ HARD proof verification registry
- ⚠️ Autonomy loop (deterministic decision engine)
- ⚠️ Engine adapters (SilentEngine + ExecutionEngine)
- ⚠️ Cost guards + circuit breakers
- ⚠️ API endpoints (full lifecycle)
- ⚠️ Tests (unit + 1 E2E)

---

## 📖 Documentation

- **[HANDOFF_MVA.md](./HANDOFF_MVA.md)** — Full implementation spec
- **[sql/001_init.sql](./sql/001_init.sql)** — Database schema

---

## 🧪 Next Steps

1. Read [HANDOFF_MVA.md](./HANDOFF_MVA.md)
2. Implement Postgres stores
3. Implement receipt/proof verification
4. Implement decision engine + autonomy loop
5. Wire engine adapters
6. Add cost guards
7. Build API endpoints
8. Write tests

**No scope expansion permitted.** Build exactly what's specified in HANDOFF_MVA.md.
