# Proof Receipt
*PROVE phase cannot complete without this. SHIP cannot start without this.*

---

## Session
Date: [YYYY-MM-DD]
Solution: [solution name]
Repo / Branch: [owner/repo / branch]

## Work Completed
- [what was built]

## Verification Results

```bash
# Run these — all must pass
pnpm typecheck    → [PASS / FAIL: error]
pnpm lint         → [PASS / FAIL: error]  
pnpm test         → [PASS / N/A / FAIL: error]
pnpm build        → [PASS / FAIL: error]
pnpm test:e2e     → [PASS / N/A / FAIL: error]
```

## CI Status
CI pipeline: [PASS / FAIL / PENDING]
Link: [GitHub Actions URL]

## Security
TruffleHog scan: [CLEAN / FLAG: detail]
RLS on new tables: [YES / N/A]
No service role in client: [CONFIRMED]

## AI (if applicable)
Eval cases run: [N / N/A]
Promptfoo result: [PASS / FAIL / N/A]
Source shown to user: [YES / N/A]
User confirmation required: [YES / NO / N/A]

## Preview
Preview URL: [URL or N/A]
Mobile 375px checked: [YES / N/A]
All states work (empty/loading/error/success): [YES / NO — detail]

## REVIEW Verdict
PASS / FLAG / REJECT
Blocking issues: [none / list]

## QA Verdict
PASS / FAIL
Stranger can complete flow: [YES / NO]

## Approved to Ship?
[ ] YES — all proof complete
[ ] NO — [what needs to be fixed]
