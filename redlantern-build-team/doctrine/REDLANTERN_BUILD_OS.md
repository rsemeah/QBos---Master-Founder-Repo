# RedLantern Build OS
*The master operating doctrine for all RedLantern solutions.*
*Last updated: 2026-06-05 | Owner: Rory Semeah*

---

## The Principle

RedLantern does not ship vibes. Every solution must pass through a proven lifecycle.

## The Hierarchy

```
Rory decides.
QBos stores doctrine.
Robby conducts.
SwarmClaw agents execute.
GitHub persists.
CI verifies.
Security blocks.
QA proves.
Vercel ships.
Observability watches.
Lessons return to QBos.
```

## The Lifecycle

Every piece of work must pass through all 9 phases:

```
1. INTAKE         Capture request, context, desired outcome
2. SCOPE_LOCK     Define exact boundaries — files, tables, agents, tests
3. PLAN           Decide implementation, risk, data contracts, AI contracts
4. EXECUTE        Agents build only the approved scope
5. PROVE          Tests, security, evals, preview — all green
6. HANDOFF        Summarize what changed, what remains, what to watch
7. SHIP           Merge, deploy, confirm production
8. OBSERVE        Watch errors, usage, cost, AI failures
9. IMPROVE        Feed lessons back to QBos
```

**A feature is not done until:**
- It is scoped (SCOPE_LOCK receipt)
- It is built (EXECUTION receipt)
- It is reviewed (REVIEW: PASS)
- It is tested (QA: PASS)
- It is secured (Security: CLEAN)
- It is previewed (Preview URL confirmed)
- It is approved (Rory: YES)
- It is deployed (SHIP receipt)
- It is observable (PostHog event + Sentry wired)

## The Role Boundary

| Role | Owns |
|------|------|
| Rory | Direction, approval, priority, judgment, final say |
| QBos | Doctrine, templates, standards, lessons |
| Robby | Lifecycle enforcement, phase gates, receipts, blockers |
| SwarmClaw agents | Specialized execution within their domain |
| GitHub | Source truth, CI, branch protection |
| CI | Mechanical proof (typecheck, lint, build, test) |
| Security | Hard blocks — secrets, RLS, auth |
| QA | User reality — does a stranger succeed? |
| Vercel | Deploy surface |
| Observability | Production truth |

## Anti-Sprawl Rules

1. QBos owns doctrine. Solution repos do not.
2. Robby owns lifecycle. Agents do not skip phases.
3. If two places claim the same truth, the design is wrong.
4. A feature that cannot be scoped cannot be built.
5. A feature that cannot be proved cannot be shipped.
6. Documentation that helps no one execute is premature.
7. Products earn documentation by shipping and getting used.
