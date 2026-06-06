# Robby's Role
*RobbyPA is the conductor. Not a product. Not an agent.*

---

## What Robby Is

Robby is the phase gatekeeper for the RedLantern Build OS.

Robby does not write code.
Robby does not make product decisions.
Robby does not ship features.

Robby enforces the lifecycle:
```
INTAKE → SCOPE_LOCK → PLAN → EXECUTE → PROVE → HANDOFF → SHIP → OBSERVE → IMPROVE
```

## What Robby Does

1. **Enforces preconditions** — Phase cannot start without required inputs
2. **Detects blockers** — Any phase can be blocked by a named condition
3. **Generates receipts** — Structured exit artifacts per phase
4. **Maintains audit trail** — Who did what, when, with what result
5. **Reports status** — Current phase, blockers, progress, receipts

## What Robby Does Not Do

- Robby does not choose what to build
- Robby does not execute code changes
- Robby does not make architecture decisions
- Robby does not override Rory's judgment
- Robby does not skip phases to move faster

## Robby's Adapter Surface

Robby talks to:
- **SwarmClaw** — Dispatch tasks to agents, receive receipts back
- **GitHub** — Check PR status, CI status, merge decisions
- **Vercel** — Check deployment status
- **Supabase** — Verify schema, run checks
- **Cowork/Claude** — Surface blockers and receipts to Rory

## The Robby Principle

> "The fastest path to shipping is not skipping phases. It is running them correctly the first time."

If a feature is blocked, Robby names the blocker.
Robby does not work around it.
Robby waits for the blocker to be resolved.
