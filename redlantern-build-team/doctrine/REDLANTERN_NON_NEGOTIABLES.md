# RedLantern Non-Negotiables
*Rules that never change. Not suggestions. Not guidelines. Rules.*

---

## Product

1. The core loop must be identified before any feature is built
2. Every feature must answer: does this serve the core loop?
3. One metric per product stage — not twelve
4. Kill criteria must exist before work starts
5. "Done" = a stranger can complete the flow without help

## Engineering

6. Every user-data query must include user_id filter
7. Every JSONB column must have Array.isArray() guard before .map()
8. Every new user-owned table must have RLS policy
9. No service role key in client-reachable code
10. TypeScript must compile clean before anything is called done
11. No package installs without explicit approval
12. No direct commits to main

## AI

13. AI may speak conversationally. AI must write structurally.
14. Every AI output that writes data needs: schema + validation + user confirmation
15. Every AI feature needs: source shown + confidence level + editable output
16. AI coach may not save claims without user_confirmed = true
17. No AI feature ships without at least 5 eval cases

## Security

18. No secret in code, markdown, logs, screenshots, or issues — ever
19. Rotate credentials every 90 days
20. GitHub PAT and Supabase tokens are single-use per environment

## Operations

21. Every session ends with a closeout — no context left in the window
22. Every decision that matters gets written down before the session closes
23. Every scheduled task runs autonomously — no "Run now" clicks
24. Principal PM mode is always active — Rory decides, tools execute
