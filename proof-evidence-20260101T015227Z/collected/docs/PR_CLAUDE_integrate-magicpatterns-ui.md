Title: feat(ui): integrate MagicPatterns UI into apps/rob-ui (Iteration 1 & 2)

Summary
-------
This PR integrates the MagicPatterns UI into `apps/rob-ui`, wires the frontend `robClient` to the QBos backend APIs (`/api/rob/init` and `/api/rob/message`), and adds TruthSerum receipt emission from the browser for session creation and chat messages.

Changes included
----------------
- Added MagicPatterns UI files under `apps/rob-ui/src` (merged)
- Patched `apps/rob-ui/src/lib/rob-client.ts` to call `/api/rob` endpoints and `/api/receipts`
- Patched `apps/rob-ui/src/pages/RobPage.tsx` to emit `session.created`, `chat.message`, and `chat.response` receipts
- Added `apps/rob-ui/src/pages/RobBuilder.tsx` (Iteration 2) that wires `initSession()` and `sendMessage()` and emits receipts
- Added iteration artifacts: `ITERATION1_NEXT_STEPS.md`, `integration_receipts.jsonl`, `iteration1-ui-running.png`
- Added helper scripts: `scripts/finalize-iteration1.sh`, `scripts/write-sample-receipt.js`

Testing
-------
1. Start backend dev server (apps/proof-harness): `cd apps/proof-harness && npm run dev`
2. Start frontend dev server (apps/rob-ui): `cd apps/rob-ui && npx vite`
3. Visit the UI, create a session in RobBuilder or Rob page, send a message, and confirm receipts are posted to `/api/receipts`.

Notes
-----
- The branch was pushed: `claude/integrate-magicpatterns-ui-V9Y99`
- Create a PR on GitHub (auto link provided after push) or use the branch to open a draft.

GitHub PR link (create):
https://github.com/rsemeah/QBos---Master-Founder-Repo/pull/new/claude/integrate-magicpatterns-ui-V9Y99

Requested reviewers: @rsemeah
