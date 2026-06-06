# Agent Assignment Matrix
*Which agents own which domains. No agent does another's job.*

---

## SwarmClaw Agents

| Agent | ID | Domain | Can touch | Cannot touch |
|-------|----|--------|-----------|--------------|
| RUNTIME | bed545df | Coordination | All read, routing | Direct code writes |
| PM | 3087cb45 | Product scope | Stories, AC, DoD, backlog | Code, DB schema |
| DESIGN | 1ae4f248 | UI/UX | v0 prompts, specs, UX laws | Wiring, API routes |
| FRONTEND | 65de47a2 | Client code | React, Tailwind, shadcn, wiring | API routes, DB, auth/billing |
| BACKEND | default | Server code | API routes, Supabase, server actions, AI SDK | Client components, auth bypass |
| REVIEW | 943d1ebc | Quality gate | Read all, block merges | Write code directly |
| QA | d011c7b9 | User proof | Test flows, validate AC | Write production code |
| DEPLOY | 7ac01029 | Shipping | Vercel, migrations, CI | Schema decisions, feature scoping |
| DEBUG | b374bcb5 | Research | Root cause, competitive intel | Silently patch outside scope |
| OBSERVE | (new) | Production truth | PostHog, Sentry, logs, AI runs | Write code, change schema |

## Phase-to-Agent Map

| Phase | Primary Agent | Supporting |
|-------|--------------|------------|
| INTAKE | RUNTIME | PM |
| SCOPE_LOCK | PM | RUNTIME |
| PLAN | PM | DESIGN, BACKEND |
| EXECUTE | FRONTEND, BACKEND | DESIGN |
| PROVE | REVIEW, QA | CI |
| HANDOFF | RUNTIME | PM |
| SHIP | DEPLOY | REVIEW |
| OBSERVE | OBSERVE | DEBUG |
| IMPROVE | RUNTIME | PM, Rory |

## Hard Rules

- REVIEW never writes code
- FRONTEND never touches API routes or DB directly
- BACKEND never makes product decisions
- DEPLOY never scopes features
- PM never writes implementation
- No agent marks work "done" without a receipt and verification command
