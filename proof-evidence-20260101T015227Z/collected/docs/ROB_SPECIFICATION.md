# ROB THE QUIETBUILDER — SPECIFICATION

**Version:** 1.0  
**Status:** Implementation In Progress  
**Constitutional Compliance:** Required  

---

## MISSION

Rob is the **user-facing mediator** between humans and the QuietBuild OS constitutional framework.

Rob feels like texting a supportive friend who happens to be a world-class engineer.

Rob's job:
- Guide users from "I have an idea" to "here's your live app"
- Build real artifacts (code, repos, deployments)
- Never lie about progress or readiness
- Translate constraints into safe paths
- Make complexity invisible

---

## NON-NEGOTIABLES

### Truth Requirements (SightEngine™ + TruthSerum™)

1. **No Claims Without Receipts**
   - Rob never says "deployed" without `vercel.deploy_success` receipt
   - Rob never says "ready" without passing readiness gates
   - Progress ≠ Readiness (both tracked separately)

2. **Unknown is First-Class**
   - If Rob lacks proof → say "Unknown" + exact next step
   - Never guess or hallucinate state

3. **Dual Progress Tracking**
   - `progress_percent` (0-100): How far through build steps
   - `readiness_tier`: Draft | Shaped | Viable | Ready | Published
   - UI must show both

4. **Receipt Audit Trail**
   - Every action logs a receipt
   - Every receipt links to: user message OR engine rule OR system constraint
   - All receipts queryable for replay

5. **Undo Without AI Consumption**
   - Changes are undoable pre-publish
   - Undo doesn't burn AI quota

6. **No Passwords Ever**
   - OAuth/tokens only
   - Never ask users to paste secrets

7. **Failure Semantics**
   - Never generic "error"
   - Always typed: BLOCKED | UNKNOWN | UNAVAILABLE | DEFERRED | VIEW_ONLY | NO_OP | RATE_LIMITED
   - Every failure includes safe next action

---

## STATE MACHINE

Rob's states are **derived from ExecutionEngine**, never UI-local.

### Canonical States

```
INIT          → Fresh session, no context yet
WAITING       → Idle, ready for user input
LISTENING     → Processing user input
CLARIFYING    → Need more info from user
CONFIRMING    → User approval required before action
BUILDING      → Executing build/generation
VERIFYING     → Running safety/quality checks
READY         → Artifact complete, awaiting deploy intent
BLOCKED       → Cannot proceed (show reason + alternative)
UNKNOWN       → Missing proof (show what's needed)
VIEW_ONLY     → Caps hit, work preserved, upgrade required
DEFERRED      → User chose to skip this step
PUBLISHED     → Live deployment confirmed by receipts
```

### State Transitions

All transitions emit receipts:
```typescript
{
  action_type: 'state_transition',
  metadata: {
    from_state: 'BUILDING',
    to_state: 'READY',
    reason: 'Build passed, deploy intent required',
    triggered_by_message_id: '...'
  }
}
```

---

## READINESS TIERS

Readiness is **gate-based**, not vibes.

### Tier Definitions

**Draft**
- Template selected
- App named
- No build yet

**Shaped**
- Features selected
- Supabase connection established (or explicitly deferred)
- Dependencies resolved

**Viable**
- Repo generated
- Build passed (`npm run build` success)
- Preview renders

**Ready**
- Deploy intent confirmed by user
- Env vars validated
- Safety checks passed
- Build passed

**Published**
- Vercel deployment succeeded (receipt: `vercel.deploy_success`)
- Healthcheck passed (receipt: `healthcheck.ok`)
- Live URL returned

---

## USER FLOW

### "Grandma Flow" (Knows Nothing)

Modal-guided 5 steps:

1. **Pick Template** → Shows real screenshots + descriptions
2. **Name Your App** → Validation (no spaces, lowercase, available on GitHub)
3. **Choose Features** → Checkboxes (auth, payments, admin, etc.)
4. **Style It** → Basic theme tokens (colors, fonts)
5. **Confirm Build** → Shows what will happen, requires explicit "Yes"

After confirmation → Rob enters BUILDING state.

### "Power User Flow" (Knows Exactly What They Want)

Chat directly:
- "Build me a SaaS starter with Stripe and Supabase auth"
- Rob extracts intent, confirms, builds

---

## ARCHITECTURE

### Database Schema (Supabase)

**rob_sessions**
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
template_id text
app_name text
progress_percent int CHECK (progress_percent BETWEEN 0 AND 100)
readiness_tier text CHECK (readiness_tier IN ('draft', 'shaped', 'viable', 'ready', 'published'))
current_state text CHECK (current_state IN ('INIT', 'WAITING', ...))
app_config jsonb
created_at timestamptz
updated_at timestamptz
```

**rob_messages**
```sql
id uuid PRIMARY KEY
session_id uuid REFERENCES rob_sessions
role text CHECK (role IN ('user', 'assistant', 'system'))
content text
metadata jsonb
created_at timestamptz
```

**rob_receipts**
```sql
id uuid PRIMARY KEY
session_id uuid REFERENCES rob_sessions
type text
details jsonb
caused_by_message_id uuid REFERENCES rob_messages
caused_by_rule text
caused_by_constraint text
created_at timestamptz
```

**rob_state_transitions**
```sql
id uuid PRIMARY KEY
session_id uuid REFERENCES rob_sessions
from_state text
to_state text
reason text
triggered_by_message_id uuid
created_at timestamptz
```

**rob_config_history**
```sql
id uuid PRIMARY KEY
session_id uuid REFERENCES rob_sessions
key text
old_value jsonb
new_value jsonb
changed_by_message_id uuid
created_at timestamptz
```

**rob_undo_stack**
```sql
id uuid PRIMARY KEY
session_id uuid REFERENCES rob_sessions
action_type text
snapshot jsonb
created_at timestamptz
```

**rob_ai_usage**
```sql
id uuid PRIMARY KEY
session_id uuid REFERENCES rob_sessions
triggered_by_message_id uuid REFERENCES rob_messages
provider text
model text
tokens_in int
tokens_out int
cost_usd numeric(10,6)
latency_ms int
created_at timestamptz
```

**rob_plans**
```sql
id text PRIMARY KEY CHECK (id IN ('free', 'pro', 'team'))
limits jsonb
```

**rob_user_entitlements**
```sql
user_id uuid PRIMARY KEY REFERENCES auth.users
plan_id text REFERENCES rob_plans
stripe_customer_id text
stripe_subscription_id text
status text CHECK (status IN ('active', 'past_due', 'canceled'))
current_period_end timestamptz
updated_at timestamptz
```

### API Routes

**POST /api/rob/session**
- Creates new build session
- Requires auth
- Returns session_id
- Emits: `session.created` receipt
- State: INIT → WAITING

**POST /api/rob/chat**
- Processes user message
- Pipeline:
  1. Auth check
  2. Billing cap enforcement
  3. Persist user message
  4. State transition (LISTENING)
  5. SilentEngine invocation
  6. TruthSerum validation
  7. Persist assistant message
  8. Return stream
- Emits: `user_input_received`, `ai_invoked`, `message_validated`

**POST /api/rob/build**
- Triggers code generation
- Requires readiness tier >= Shaped
- Pipeline:
  1. Load template
  2. Apply feature patches
  3. Write to temp directory
  4. Run `npm install && npm run build`
  5. Record outcome
- Emits: `build.started`, `build.passed` or `build.failed`

**POST /api/rob/deploy**
- Requires readiness tier = Ready
- Requires user confirmation receipt
- Pipeline:
  1. GitHub OAuth + create repo
  2. Push commit
  3. Vercel project creation
  4. Set env vars
  5. Trigger deploy
  6. Poll status
  7. Healthcheck
- Emits: `github.repo_created`, `vercel.deploy_success`, `healthcheck.ok`

**POST /api/rob/undo**
- Pops from undo stack
- Restores snapshot
- Does not consume AI quota
- Emits: `action.undone`

**GET /api/rob/receipts/:sessionId**
- Returns all receipts for session
- Includes TruthSerum validation report

### UI (Single Screen)

**Route:** `/build`

**Layout:**
- Left: Chat interface
- Right: Live preview (iframe or image)
- Top: Status bar (state, progress, readiness, AI budget)
- Bottom: Input + file dropzone

**Status Bar Shows:**
- Current state icon + text
- Progress: "47% complete"
- Readiness: "Viable" (with badge color)
- AI budget: "12 of 50 messages used today"
- Blockers: Red badge if any

**View-Only Banner (if caps hit):**
- "You've used today's AI quota. Your work is saved. Upgrade to continue."
- Shows upgrade link
- Hides input
- Shows preview + receipts

---

## ENGINE COORDINATION

Rob coordinates with all constitutional engines:

### ExecutionEngine
- Rob IS the ExecutionEngine's user interface
- State machine lives here
- Progress computation
- Receipt queries

### IdentityEngine
- Session management
- User context

### CharterEngine
- Consent checks before external integrations
- GDPR compliance for data handling

### ConfigEngine
- Feature flag evaluation
- Environment-aware behavior

### PaywallEngine
- Entitlement checks
- Usage cap enforcement
- Triggers VIEW_ONLY state

### SilentEngine
- AI routing for chat
- Cost tracking
- Provider failover

### SightEngine
- Validates templates before use
- Validates generated previews
- Rejects low-trust visuals

### NotificationsEngine
- Sends deploy success emails
- Sends limit warning emails

---

## TEMPLATES + PATCHES

Rob generates code via **template + patch** composition (not raw AI generation).

### Template Structure

**Location:** `/templates/saas/base/`

Must include:
- Valid Next.js app
- package.json
- tsconfig.json
- README.md
- .env.example

### Patch Structure

**Location:** `/templates/saas/patches/auth/`

Must define:
- Files to add/modify
- Dependencies to add to package.json
- Env vars required
- Supabase migrations (if applicable)
- Receipt types to emit when applied

### Build Verification

Before marking build.passed:
1. Write files to temp directory
2. Run `npm install`
3. Run `npm run build`
4. Check exit code
5. Emit receipt with logs hash

---

## TRUTHSERUM INTEGRATION

### Chat Pipeline Validation

After AI generates response, TruthSerum checks:

**Deployment Claims:**
- "deployed" / "live" / "published" → Requires `vercel.deploy_success`
- If missing → Rewrite to: "Build complete. Ready to deploy when you confirm."

**Build Claims:**
- "added auth" / "implemented X" → Requires `feature.added.X` receipt
- If missing → Rewrite to: "I've prepared the auth setup. Building now..."

**Readiness Claims:**
- "your app is ready" → Requires readiness_tier = Ready
- If missing → Rewrite to: "Your app is X% complete. Next: Y."

**Unknown State:**
- Any ambiguous state → Rewrite to: "I'm not sure yet. Can you tell me X?"

### Validation Report

Every response includes (in metadata, not shown to user):
```typescript
{
  truthserum: {
    original_text: "...",
    rewritten: true/false,
    violations: [...],
    supporting_receipts: [...]
  }
}
```

---

## FAILURE HANDLING

### User-Facing Copy

**BLOCKED:**
- "I can't add that feature because [reason]. Would you like to [safe alternative]?"

**UNKNOWN:**
- "I need to know [X] before I can continue. Can you tell me [specific question]?"

**UNAVAILABLE:**
- "My AI provider is down. Your work is saved. Try again in a moment."

**DEFERRED:**
- "Got it — skipping Supabase for now. You can add it later from settings."

**VIEW_ONLY:**
- "You've used today's AI quota. Your work is auto-saved. Upgrade to keep building."

**RATE_LIMITED:**
- "Too many requests. Try again in 30 seconds."

---

## POST-PUBLISH CHECKLIST

After successful publish, show "Next Steps" (10 items):

1. **Custom Domain** → [Vercel docs](https://vercel.com/docs/custom-domains)
2. **Environment Variables** → [Vercel env vars](https://vercel.com/docs/environment-variables)
3. **Supabase Migrations** → [Supabase docs](https://supabase.com/docs/guides/cli/migrations)
4. **Stripe Setup** → [Stripe docs](https://stripe.com/docs/dashboard)
5. **GitHub OAuth App** → [GitHub OAuth docs](https://docs.github.com/en/apps/oauth-apps)
6. **DNS Configuration** → [DNS basics](https://www.cloudflare.com/learning/dns/what-is-dns/)
7. **Analytics Setup** → [PostHog docs](https://posthog.com/docs)
8. **Email Provider** → [Resend](https://resend.com/docs) or [SendGrid](https://sendgrid.com/docs)
9. **Monitor Errors** → [Sentry](https://docs.sentry.io/)
10. **Invite Team** → In-app settings

---

## TESTING REQUIREMENTS

### Unit Tests
- TruthSerum rewrites false claims
- Readiness tier gates enforce correctly
- State transitions emit receipts

### Integration Tests
- Template + patch generates valid repo
- Generated repo passes `npm run build`
- Receipt chains are complete

### E2E Tests
- Grandma flow (template → build → deploy)
- Mock external APIs (GitHub, Vercel)
- Verify receipts at each step

**Simulated Receipts:**
- For CI: Mark `receipt.details.simulated = true`
- TruthSerum must not treat simulated as real deploy

---

## IMPLEMENTATION CHECKLIST

- [ ] ROB_SPECIFICATION.md (this file)
- [ ] Supabase migrations (all rob_* tables)
- [ ] RobEngine class (state machine + orchestration)
- [ ] /api/rob/session route
- [ ] /api/rob/chat route (with TruthSerum)
- [ ] /api/rob/build route
- [ ] /api/rob/deploy route (GitHub + Vercel)
- [ ] /api/rob/undo route
- [ ] /build UI route (chat + preview)
- [ ] Template system (base + patches)
- [ ] Build verification (temp dir + npm build)
- [ ] Billing middleware (caps enforcement)
- [ ] VIEW_ONLY state handling
- [ ] Post-publish checklist UI
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

---

**End of Specification.**
