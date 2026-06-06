# ACTIVATION.md — How to Turn QuietBuild OS On
# By Red LLC · RedLantern Studios · Last updated: 2026-06-06

> This is the full activation sequence for QuietBuild OS across all active repos.
> Run in order. Each step has a verified done state.

---

## CURRENT STATE (as of 2026-06-06)

| Component | Status |
|---|---|
| Architect (CLAUDE.md) | ✓ Built — needs install in each repo |
| Builder (AGENTS.md) | ✓ Built — needs install in each repo |
| Slash commands (7) | ✓ Built — needs install |
| PM Proxy (/pm-proxy) | ✓ Built — needs install |
| Squad definitions (squads.md) | ✓ Built — needs push to QBos |
| QBos Build Team OS (PR #43) | ⚠ Pending merge |
| Robby PA (ROBBY_INTEGRATION.md) | ✓ Live on QBos main |
| Mode Classifier in Robby | ✗ Missing — needs to be added |
| SwarmClaw agents (10) | ✓ Live — tunnel active |
| Cowork skills | ✓ Active in every session |
| install.sh | ✓ Built — ready to run |

---

## STEP 1 — Merge QBos PR #43

**What this does:** Brings `/conductor/`, `/doctrine/`, `/receipts/`, and `ROBBY_INTEGRATION.md` into QBos main.

```bash
# Review PR #43 at: https://github.com/rsemeah/QBos---Master-Founder-Repo/pull/43
# Use /review before merging
```

**Done when:** PR merged, all files live on main.

---

## STEP 2 — Push new files to QBos

After PR #43 merges, add to QBos:

```
/redlantern-build-team/conductor/squads.md    ← from BuildTeam/squads.md
/redlantern-build-team/commands/pm-proxy.md   ← from BuildTeam/commands/pm-proxy.md
```

Also add the mode classifier to `ROBBY_INTEGRATION.md` (see Step 3).

---

## STEP 3 — Add Mode Classifier to ROBBY_INTEGRATION.md

Add this section to `redlantern-build-team/ROBBY_INTEGRATION.md`:

```markdown
## MODE CLASSIFIER

Robby PA runs this before routing any task:

| Signal | Mode | Squad | Agent limit |
|---|---|---|---|
| Quick wording, naming, small feedback | QUICK | None — 1 specialist only | 1 |
| Feature, user story, new functionality | PLAYBOOK | Feature Squad | 5 |
| Bug, error, broken behavior | INCIDENT | Bug Squad | 6 |
| Production ship, client delivery | SPRINT | Launch Squad | 5 |
| Auth, RLS, data, security | SECURITY | Security Squad | 4 + Rory approval |
| Copy, brand, marketing, pitch | BRAND | Brand Squad | 4 |
| Multi-domain mixed request | SPLIT | Split before routing | N/A |

Rule: Mode is selected BEFORE squad activation. No mode = no execution.
```

---

## STEP 4 — Install BuildTeam in active repos

Run for each repo: HireWire, Amina, byred_os

**Option A (Codespace):**
```bash
# Paste install.sh into Codespace terminal
bash <(curl -s https://raw.githubusercontent.com/rsemeah/QBos---Master-Founder-Repo/main/redlantern-build-team/install.sh)
```

**Option B (local):**
```bash
cd /path/to/repo
cp /path/to/BuildTeam/CLAUDE.md .
cp /path/to/BuildTeam/AGENTS.md .
mkdir -p .claude/commands
cp /path/to/BuildTeam/commands/*.md .claude/commands/
```

Then create `BUILD_CONSTITUTION.md` for each repo from the HireWire template.

**Done when:** CLAUDE.md + AGENTS.md + all commands present in repo root / .claude/commands/

---

## STEP 5 — Verify SwarmClaw + Hooks

```bash
# Confirm tunnel is live
cat ~/.swarmclaw-tunnel/start-tunnel.sh
launchctl list | grep swarmclaw

# Confirm hooks are in .claude/settings.json for each repo
cat /path/to/repo/.claude/settings.json
```

**Done when:** Tunnel responds + settings.json has PreToolUse and PostToolUse hooks.

---

## STEP 6 — First run test per repo

Run this sequence in each newly installed repo to verify the full stack works:

```
1. Open repo in VS Code Codespace
2. Open Claude Code tab → type: /constitution
   Expected: BUILD_CONSTITUTION.md loads and displays
3. Give a fake feature request
4. Run: /pm-proxy
   Expected: PM Brief format appears, asks max 3 questions
5. Run: /scope [brief]
   Expected: Scope lock with files, done state, wait for approval
6. Run: /review [any small diff]
   Expected: PASS/FLAG/REJECT verdict with checklist
7. Run: /closeout
   Expected: Session summary with decisions + next action
```

**Done when:** All 6 commands respond correctly in all 3 repos.

---

## FULL ACTIVATION CHECKLIST

```
[ ] QBos PR #43 merged
[ ] squads.md pushed to /conductor/
[ ] pm-proxy.md pushed to /commands/
[ ] Mode classifier added to ROBBY_INTEGRATION.md
[ ] BuildTeam installed in HireWire
[ ] BuildTeam installed in Amina
[ ] BuildTeam installed in byred_os
[ ] BUILD_CONSTITUTION.md exists in each repo
[ ] SwarmClaw tunnel verified live
[ ] Hooks verified in .claude/settings.json (all repos)
[ ] First-run test passed in all 3 repos
```

QuietBuild OS is ON when all boxes are checked.
