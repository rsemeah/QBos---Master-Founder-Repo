# Ship Receipt
*Written by DEPLOY after production deploy is confirmed.*

---

## Session
Date: [YYYY-MM-DD]
Solution: [solution name]
Repo: [owner/repo]
Commit SHA: [sha]

## What Shipped
- [summary of what was deployed]

## Database
Migration ran: [YES / NO / N/A]
Migration name: [name or N/A]
RLS confirmed: [YES / N/A]
Rollback SQL: [path or N/A]

## Environment
Production URL: [URL]
Vercel deployment ID: [ID]
Post-deploy smoke test: [PASS / FAIL]

## Rollback Plan
If production breaks, here is how to revert:
```bash
[exact rollback command or steps]
```

## Sentry: First 10 Minutes
New errors seen: [YES — detail / NO]

## PostHog: First Event
Expected event firing: [YES / NO / N/A]

## Approved by Rory
- [ ] Rory reviewed ship receipt
- [ ] Deploy confirmed successful
