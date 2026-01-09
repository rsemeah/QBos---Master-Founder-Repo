# Tool Boundaries (Canonical)

**Effective Date:** January 8, 2026  
**Authority:** Single Source of Truth (SSOT) for QBos introspection

---

## Rule: QBos is defined ONLY by canonical repo documents and receipts

Assistants and tools may **only** summarize QBos from canonical files. No runtime dashboards or external services count as authority.

---

## ✅ Allowed Sources (Canonical)

### Documentation
- `README.md` (top-level architecture)
- `V3_COMPLETE_8_ENGINES_SPEC.md` (engine specifications)
- `docs/QBOS_TODAY.md` (current status SSOT)
- `docs/` directory (any status/design docs)

### Proof Artifacts
- `proof/` directory (all generated proofs)
- `receipts/` directory (all receipt JSONs)
- `RECEIPTS.md` (receipt inventory)

### Code Source of Truth
- `packages/` (all 8 engines + adapters)
- `apps/` (proof-harness, rob-ui)
- `supabase/migrations/` (database schema)
- `.github/workflows/` (CI truth enforcement)

---

## ❌ Disallowed Behavior

### No External Dashboard Authority
- ❌ Spinning up Serena, Claude Code, or any external UI as "proof"
- ❌ Using tool dashboards to establish what "is true"
- ❌ Treating runtime output as canonical (output is temporary, receipts are canonical)

### No Tool-Generated Authority
- ❌ Any AI tool spinning up local HTTP servers and claiming the output is definitive
- ❌ Using IDE UIs, extensions, or agent frameworks to redefine status
- ❌ Overwriting run artifacts from prior sessions (immutability rule)

### No Claim Without Citation
- If a tool cannot cite a canonical file + line number or receipt artifact, it must say **"UNKNOWN"**
- "Probably true" statements are forbidden
- "Based on code inspection" without evidence is not acceptable

---

## 🧪 TruthSerum Enforcement

All claims about QBos must carry one of these statuses:

- **✅ VERIFIED** — Canonical docs + receipts confirm it
- **🟡 PARTIAL** — Some components done, others Unknown
- **❓ UNKNOWN** — Not confirmed; needs receipt or doc evidence
- **❌ NOT DONE** — Explicitly not yet implemented

**Forbidden:** Any claim without status badge.

---

## What This Prevents

1. **Dashboard Inflation** — No Serena/agent UI is an authority on what QBos "is"
2. **Silent Authority Shifts** — Tools can't redefine status without updating canonical docs
3. **Lost Context** — One page (`docs/QBOS_TODAY.md`) is always the source for "what is QBos?"
4. **Contradictory Claims** — All answers trace back to the same canonical files

---

## For Future Assistants

When asked "What is QBos today?", your answer must:

1. Start with `docs/QBOS_TODAY.md` (the SSOT)
2. Cite line numbers from canonical files
3. Link to proof artifacts if referencing runtime behavior
4. Use status badges (✅ / 🟡 / ❓ / ❌)
5. Never claim something is "obvious from the code" without line citations

Example:
```
ExecutionEngine: ✅ VERIFIED
  - 900+ lines: packages/engines/execution-engine/core/src/RobEngine.ts
  - Receipt: receipts/execution_engine_Dec24_2025.json
```

---

## Escalation

If a tool tries to establish authority by running a dashboard, starting a local server, or claiming to "verify" QBos via runtime inspection:

**Your response:** "That's outside tool boundaries. Please cite canonical docs or receipts, or mark it UNKNOWN."

---

**This file is immutable and canonical. Do not override it.**
