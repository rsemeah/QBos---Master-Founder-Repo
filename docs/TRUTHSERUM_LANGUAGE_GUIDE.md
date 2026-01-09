# TruthSerum Language Guide

**Canonical vocabulary for QBos status claims. All documentation must use these terms with these definitions.**

Date: 2026-01-08  
Authority: Single Source of Truth (enforced across all docs)

---

## Status Badges (Canonical)

### ✅ VERIFIED

**Definition:** Code exists, compiles, runtime behavior captured in receipts, end-to-end tested in context.

**Evidence Required:**
- Source code file + line numbers
- Receipt artifact (in receipts/ or proof/)
- Reproducible (can be re-tested)

**Examples:**
- "ExecutionEngine: **Verified (core)**" — Code exists, state machine tested, receipts generated
- "OpenAI: **Verified (local)**" — Provider abstraction exists, tested locally with receipts

**Forbidden phrasing:**
- ❌ "Verified but not used" (contradictory)
- ❌ "Mostly verified" (pick Implemented instead)
- ❌ "Verified in isolation" (still counts as Verified, but note the limitation)

---

### 🟡 IMPLEMENTED

**Definition:** Code exists, compiles, type-safe, not yet end-to-end tested or wired to dependent systems.

**Evidence Required:**
- Source code file + line numbers
- Compiles without errors
- No runtime receipts (or receipts from isolated tests only)

**Examples:**
- "IdentityEngine: **Implemented**" — Code written, types correct, not yet wired to real auth flow
- "GitHub OAuth: **Implemented**" — Scaffolding exists, not connected to UI

**Forbidden phrasing:**
- ❌ "Ready to use" (use Verified instead)
- ❌ "Almost working" (still Implemented)
- ❌ "Just needs one more thing" (stays Implemented until that thing is Verified)

---

### ❓ UNKNOWN

**Definition:** Status unclear, intentionally not done, or blocked. No claim is made either way.

**Evidence Required:**
- Explanation of *why* Unknown (not started / blocked on external / deprioritized)
- If blocked, what's blocking it (missing API key, awaiting decision, etc.)

**Examples:**
- "Stripe billing wiring: **Unknown**" — Keys exist, integration not started
- "End-to-end deployment: **Unknown**" — Vercel client exists, orchestration not wired
- "Automated test coverage: **Unknown**" — Not prioritized, manual validation only

**Forbidden phrasing:**
- ❌ "Unknown but probably works" (makes a claim; mark it Verified or Implemented)
- ❌ "Unknown—we'll fix later" (acceptable: "Unknown—blocked on decision, see issue #123")
- ❌ "I think it's Unknown" (subjective language; be factual)

---

### ❌ NOT DONE

**Definition:** Explicitly decided not to implement. This is rare; prefer Unknown for uncommitted work.

**Evidence Required:**
- Explicit decision documented (link to issue, meeting notes, or decision log)
- Why not doing it (out of scope, replaced by alternative, deprioritized)

**Examples:**
- "Native iOS app: **Not Done**" — Web-first platform; native tier separate
- "Kubernetes deployment: **Not Done**" — Single-machine Supabase assumed, not needed for launch

**Forbidden phrasing:**
- ❌ "Not done yet" (use Implemented or Unknown instead; "not done yet" implies intent)
- ❌ "Not done—we'll add it later" (that's Unknown, not "Not Done")

---

## Reserved Words (Banned in Status Claims)

These words are forbidden because they blur the line between verification and hope:

| Banned Word | Why | Use Instead |
|-------------|-----|-------------|
| "probably" | Introduces uncertainty without marking it Unknown | Use ❓ UNKNOWN |
| "almost" | Suggests close to Verified without proof | Use 🟡 IMPLEMENTED |
| "should work" | Untested assumption | Use ❓ UNKNOWN or 🟡 IMPLEMENTED |
| "theoretically" | No empirical evidence | Use ❓ UNKNOWN |
| "ready" | Ambiguous (ready to code? ready to ship?) | Use ✅ VERIFIED or 🟡 IMPLEMENTED |
| "mostly done" | No badge for "mostly" | Pick Implemented or Unknown |
| "in progress" | Too vague; state the last concrete status | Use ✅ VERIFIED or 🟡 IMPLEMENTED |
| "seems to work" | Unscientific; provide receipt | Use ✅ VERIFIED with receipt path |

---

## How to Mark Claims

### Format: `[System]: **[Status (context)]**`

**Good examples:**

```
ExecutionEngine: **Verified (core)**
Receipt: receipts/execution_core_2026-01-08.jsonl

IdentityEngine: **Implemented**
Receipt: receipts/identity_compile_2026-01-08.jsonl

OpenAI: **Verified (local)**
Receipt: receipts/openai_local_2026-01-08.jsonl

GitHub PR creation: **Unknown**
Reason: Not wired to message handler yet

Native iOS: **Not Done**
Decision: Web-first; separate tier for mobile
```

**Bad examples:**

```
❌ ExecutionEngine: **Probably verified**
❌ IdentityEngine: **Almost implemented**
❌ OpenAI: **Should work**
❌ GitHub PR: **In progress**
❌ Native iOS: **Ready to build later**
```

---

## Receipt Paths (Always Include)

Every claim must point to proof:

```md
ExecutionEngine: **Verified (core)**
Receipt: receipts/execution_core_2026-01-08.jsonl
```

If receipt doesn't exist yet, use placeholder:

```md
PaywallEngine: **Implemented (logic)**
Receipt: receipts/paywall_logic_2026-01-08.jsonl (pending)
```

Never omit receipt paths.

---

## What This Prevents

1. **Status Drift** — "Working on it" → "Ready" → "Deployed" without evidence
2. **Semantic Inflation** — "Implemented" doesn't mean "Verified"; language enforces it
3. **Synthesis Confusion** — No AI tool can "synthesize" a new status; must use canonical vocabulary
4. **Ambiguity Creep** — "Probably", "mostly", "should" are explicitly forbidden
5. **Dashboard Authority** — Can't claim status via UI; must cite receipts

---

## Using This Guide

### For Documentation Writers

Before writing any status claim:

1. Does it have a receipt artifact? → **Verified**
2. Does the code compile but no runtime proof? → **Implemented**
3. Is it blocked or intentionally delayed? → **Unknown**
4. Is there a decision not to do it? → **Not Done**

If unclear, default to **Unknown**.

### For Future Assistants

If a tool claims something is "Verified" without citing a receipt:

**Your response:** "That's not in docs/QBOS_TODAY.md with a receipt path. Please mark it UNKNOWN or link the proof."

If a tool uses banned words ("probably", "almost", "should"):

**Your response:** "That violates TRUTHSERUM_LANGUAGE_GUIDE.md. Use Verified/Implemented/Unknown instead."

### For Conversations

When discussing QBos status:

- Start with [docs/QBOS_TODAY.md](QBOS_TODAY.md)
- Use status badges (✅ / 🟡 / ❓ / ❌)
- Include receipt paths
- If something is Unknown, say why

---

## Enforcement

This guide is enforced via:

1. **CI TruthGate** — Blocks commits with banned words in docs/
2. **Code review** — PRs must use canonical vocabulary
3. **Conversation rules** — Assistants must follow this vocabulary
4. **.env.guard** — `TRUTHSERUM_ENFORCEMENT=strict` means no exceptions

---

## Updating This Guide

If you need a new status level or term:

1. Open an issue explaining why (don't just change it)
2. Propose the term + definition
3. Get agreement from team
4. Update this file + commit
5. Update all docs to use new term

---

**This guide is immutable. Do not override without team consensus.**
