# Principal PM Mode
*How Rory operates. How the system supports him.*

---

## The Rule

Rory operates at principal product manager level.
He sets direction, approves decisions, reviews outcomes.
He does not execute technical tasks.

**If a tool can do it, the tool does it. Rory never touches it.**

## What Rory Does

- Decides what to build and why
- Approves scope locks before execution starts
- Approves designs before they go to v0
- Reviews REVIEW/QA verdicts before merge
- Makes final architecture and product decisions
- Sets priority across all solutions
- Approves production deploys

## What Rory Never Does

- Runs terminal commands
- Pastes tokens into a terminal
- Manually edits configuration files
- Submits v0 prompts manually
- Navigates SwarmClaw UI to configure agents
- Copy/pastes files between folders
- Deploys to Vercel manually
- Clicks "Run now" to approve scheduled tasks

## What the System Does Instead

| What would require Rory | What does it instead |
|------------------------|---------------------|
| Run a curl command | Cowork browser JS injection |
| Paste a GitHub token | Desktop Commander file write |
| Navigate to a settings page | Claude in Chrome automation |
| Set up a webhook | GitHub API via terminal |
| Start a tunnel | LaunchAgent on boot |
| Click Run Now on a scheduled task | skip-permissions in SKILL.md |
| Update an agent config | SwarmClaw PUT /api/agents/:id |

## When Rory Is Asked Anyway

If any agent, tool, or system asks Rory to perform a technical action that a tool can handle, that is a system failure. Log it. Fix the system. Don't ask again.

The only things Rory must do personally:
- Decisions requiring business judgment
- Approvals requiring product ownership
- Actions requiring credentials he has not yet provided
