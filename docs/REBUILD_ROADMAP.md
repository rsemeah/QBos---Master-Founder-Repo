# Rebuild Roadmap: Closing the 60% Gap
**Created:** 2026-01-24
**Duration:** 12 weeks
**Goal:** Transform QuietBuild OS from "Documentation Theater" to "Actually Works"

---

## Current State (Honest Assessment)

**What Works (40%):**
- ✅ Architecture (8-engine design is sound)
- ✅ SilentEngine (AI routing with real providers)
- ✅ State machine (INTENT → EXECUTION → VERDICT)
- ✅ Receipt signing (EdDSA cryptography)
- ✅ CLI structure (`robby` command)

**What's Broken (60%):**
- ❌ All engines use in-memory storage (data lost on restart)
- ❌ TruthSerum doesn't verify external systems
- ❌ War Room returns mock data
- ❌ Tests don't run
- ❌ No real integrations (Stripe, Vercel, GitHub)
- ❌ Build workflow is simulated

---

## The 12-Week Plan

### Sprint 1-2: Foundation (Weeks 1-2)
**Goal:** Stop lying, start measuring

#### Week 1: Truth Audit
**Objective:** Remove all false claims, establish baseline

**Tasks:**
- [ ] **Day 1:** Remove all ™ symbols from code
- [ ] **Day 2:** Update README with honest feature matrix (use Verification Framework template)
- [ ] **Day 3:** Create `KNOWN_GAPS.md` listing all TODOs
- [ ] **Day 4:** Fix test script in package.json (make it run real tests)
- [ ] **Day 5:** Set up Vitest with one passing test

**Deliverable:** README accurately reflects 40% completion

**Verification Gate:**
```bash
# Must pass:
npm test  # Exits 0 with at least 1 real test
grep "Production Ready" README.md && exit 1  # No false claims
grep "™" packages/engines/**/*.ts && exit 1  # No trademark theater
```

**Demo Video:** "Before/After: Honest README"

---

#### Week 2: Test Infrastructure
**Objective:** Set up real testing with coverage

**Tasks:**
- [ ] **Day 1:** Configure Vitest for all packages
- [ ] **Day 2:** Set up Istanbul/c8 for coverage reporting
- [ ] **Day 3:** Add GitHub Actions for CI/CD
- [ ] **Day 4:** Create test database (Supabase test project)
- [ ] **Day 5:** Write first integration test (SilentEngine → OpenAI)

**Deliverable:** CI/CD runs real tests on every PR

**Verification Gate:**
```bash
# Must pass:
npm test  # Runs 5+ real tests
npm run test:coverage  # Shows actual coverage %
# GitHub Actions badge shows "passing"
```

**Demo Video:** "CI/CD Setup: Tests Running in GitHub Actions"

---

### Sprint 2-4: One Real Engine (Weeks 3-6)
**Goal:** IdentityEngine with Supabase, bcrypt, real OAuth

#### Week 3: IdentityEngine - Persistence
**Objective:** Replace in-memory Maps with Supabase

**Tasks:**
- [ ] **Day 1:** Create Supabase schema (users, sessions, orgs tables)
- [ ] **Day 2:** Replace `Map<string, User>` with Supabase client
- [ ] **Day 3:** Implement CRUD operations (create, read, update, delete users)
- [ ] **Day 4:** Write integration tests (verify Supabase persistence)
- [ ] **Day 5:** Test restart scenario (prove data survives engine restart)

**Code Change:**
```typescript
// OLD (in-memory):
private users: Map<string, User> = new Map()

// NEW (Supabase):
private supabase: SupabaseClient

async createUser(data: CreateUserInput): Promise<User> {
  const { data: user, error } = await this.supabase
    .from('users')
    .insert({ email: data.email, password_hash: await this.hashPassword(data.password) })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return user
}
```

**Verification Gate:**
- [ ] Tests: 80% coverage on IdentityEngine
- [ ] External proof: Query Supabase directly, user exists
- [ ] Demo video: Create user → restart app → user still exists

---

#### Week 4: IdentityEngine - Security
**Objective:** Add bcrypt, rate limiting, input validation

**Tasks:**
- [ ] **Day 1:** Install bcrypt, hash passwords (12 rounds)
- [ ] **Day 2:** Add input validation (Zod schemas)
- [ ] **Day 3:** Implement rate limiting (express-rate-limit)
- [ ] **Day 4:** Add email validation (regex + DNS check)
- [ ] **Day 5:** Write security tests (test password hashing, rate limits)

**Security Checklist:**
- [ ] Passwords hashed with bcrypt (cost factor 12)
- [ ] No plaintext passwords in logs or errors
- [ ] Email validation (format + DNS MX record check)
- [ ] Rate limiting: 5 login attempts per 15 minutes
- [ ] SQL injection prevention (Supabase parameterized queries)

**Verification Gate:**
- [ ] Security audit passes (run `npm audit`)
- [ ] Test: Password "test123" → hash starts with `$2b$12$`
- [ ] Demo video: Show rate limiting blocking 6th login attempt

---

#### Week 5: IdentityEngine - OAuth
**Objective:** Real Google/GitHub OAuth (not stubs)

**Tasks:**
- [ ] **Day 1:** Set up Google OAuth app (get client ID/secret)
- [ ] **Day 2:** Set up GitHub OAuth app
- [ ] **Day 3:** Implement OAuth callback handling (using Supabase Auth)
- [ ] **Day 4:** Link OAuth accounts to existing users
- [ ] **Day 5:** Write OAuth integration tests

**OAuth Flow:**
```typescript
// 1. Generate OAuth URL
const oauthUrl = await identityEngine.getOAuthURL('google')
// → https://accounts.google.com/o/oauth2/v2/auth?client_id=...

// 2. User authorizes, Google redirects with code
// 3. Exchange code for tokens
const session = await identityEngine.handleOAuthCallback('google', code)

// 4. Verify session in Supabase
const user = await supabase.auth.getUser(session.access_token)
```

**Verification Gate:**
- [ ] External proof: Google OAuth consent screen loads
- [ ] External proof: GitHub OAuth app shows in user's settings
- [ ] Test: OAuth login creates user in Supabase
- [ ] Demo video: Full OAuth flow from click to logged-in user

---

#### Week 6: IdentityEngine - RBAC
**Objective:** Real role-based access control

**Tasks:**
- [ ] **Day 1:** Design RBAC schema (roles, permissions, role_permissions)
- [ ] **Day 2:** Implement role assignment (admin, user, viewer)
- [ ] **Day 3:** Create permission checks (`canExecute`, `canView`, `canEdit`)
- [ ] **Day 4:** Add middleware for route protection
- [ ] **Day 5:** Write RBAC tests (verify permission denial)

**RBAC Example:**
```typescript
// Assign role
await identityEngine.assignRole(userId, 'admin')

// Check permission
const canDeploy = await identityEngine.hasPermission(userId, 'deploy:execute')
// → true (admin has all permissions)

// Protected route
app.post('/api/deploy', requirePermission('deploy:execute'), async (req, res) => {
  // Only admins can deploy
})
```

**Verification Gate:**
- [ ] Tests: 85% coverage on IdentityEngine (including RBAC)
- [ ] External proof: Supabase tables for roles/permissions populated
- [ ] Demo video: User without permission gets 403 Forbidden

**Sprint Deliverable:** IdentityEngine passes all 4 verification gates

---

### Sprint 3-5: TruthSerum with Real Verification (Weeks 7-9)
**Goal:** TruthSerum actually checks external systems

#### Week 7: TruthSerum - Vercel Integration
**Objective:** Verify deployments via Vercel API

**Tasks:**
- [ ] **Day 1:** Get Vercel API token, test authentication
- [ ] **Day 2:** Implement `verifyDeployment()` function (calls Vercel API)
- [ ] **Day 3:** Create deployment receipt with external proof
- [ ] **Day 4:** Write tests (mock Vercel API responses)
- [ ] **Day 5:** Test with real deployment (deploy Next.js app, verify via TruthSerum)

**Code Implementation:**
```typescript
async function verifyDeployment(receipt: DeploymentReceipt): Promise<VerificationResult> {
  // Step 1: Check receipt claims deployment
  if (!receipt.deploymentId) {
    return { verified: false, reason: 'Missing deploymentId' }
  }

  // Step 2: Call Vercel API
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${receipt.deploymentId}`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  )

  if (!response.ok) {
    return { verified: false, reason: 'Deployment not found in Vercel' }
  }

  const deployment = await response.json()

  // Step 3: Verify critical fields
  if (deployment.state !== 'READY') {
    return { verified: false, reason: `Deployment state: ${deployment.state}` }
  }

  // Step 4: Return proof
  return {
    verified: true,
    externalSource: 'Vercel API',
    timestamp: new Date().toISOString(),
    proof: {
      deploymentId: deployment.uid,
      url: deployment.url,
      state: deployment.state,
      createdAt: deployment.createdAt
    }
  }
}
```

**Verification Gate:**
- [ ] Tests: Mock Vercel API returns expected responses
- [ ] External proof: Real Vercel deployment verified
- [ ] Demo video: Deploy app → TruthSerum calls Vercel API → Shows "Verified"

---

#### Week 8: TruthSerum - GitHub Integration
**Objective:** Verify commits/PRs via GitHub API

**Tasks:**
- [ ] **Day 1:** GitHub API authentication (personal access token)
- [ ] **Day 2:** Implement `verifyCommit()` (checks commit SHA exists)
- [ ] **Day 3:** Implement `verifyPR()` (checks PR is merged)
- [ ] **Day 4:** Write tests
- [ ] **Day 5:** Test with real GitHub operations

**GitHub Verification:**
```typescript
async function verifyCommit(receipt: CommitReceipt): Promise<VerificationResult> {
  const response = await fetch(
    `https://api.github.com/repos/${receipt.owner}/${receipt.repo}/commits/${receipt.sha}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  )

  if (!response.ok) {
    return { verified: false, reason: 'Commit not found in GitHub' }
  }

  const commit = await response.json()

  return {
    verified: true,
    externalSource: 'GitHub API',
    proof: {
      sha: commit.sha,
      author: commit.commit.author.name,
      message: commit.commit.message,
      timestamp: commit.commit.author.date
    }
  }
}
```

**Verification Gate:**
- [ ] External proof: GitHub API confirms commit exists
- [ ] Demo video: Push code → TruthSerum verifies via GitHub API

---

#### Week 9: TruthSerum - Stripe Integration
**Objective:** Verify payments via Stripe API

**Tasks:**
- [ ] **Day 1:** Stripe API setup (test mode keys)
- [ ] **Day 2:** Implement `verifyPayment()` (checks payment intent)
- [ ] **Day 3:** Add webhook verification (validate Stripe signatures)
- [ ] **Day 4:** Write tests (use Stripe test fixtures)
- [ ] **Day 5:** Test with real Stripe test payment

**Stripe Verification:**
```typescript
async function verifyPayment(receipt: PaymentReceipt): Promise<VerificationResult> {
  const stripe = new Stripe(STRIPE_SECRET_KEY)

  const paymentIntent = await stripe.paymentIntents.retrieve(receipt.paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    return { verified: false, reason: `Payment status: ${paymentIntent.status}` }
  }

  return {
    verified: true,
    externalSource: 'Stripe API',
    proof: {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created
    }
  }
}
```

**Verification Gate:**
- [ ] Tests: Stripe test mode payment verified
- [ ] External proof: Stripe dashboard shows payment
- [ ] Demo video: Make test payment → TruthSerum verifies via Stripe API

**Sprint Deliverable:** TruthSerum verifies 3 external systems (Vercel, GitHub, Stripe)

---

### Sprint 4-6: Remaining Engines (Weeks 10-12)
**Goal:** Fix CharterEngine, PaywallEngine, ConfigEngine

#### Week 10: CharterEngine - Real GDPR
**Objective:** Supabase persistence, data export, audit logs

**Tasks:**
- [ ] **Day 1:** Supabase schema (consents, data_requests, audit_logs)
- [ ] **Day 2:** Implement consent tracking (with timestamps)
- [ ] **Day 3:** Data export (JSON download of user data)
- [ ] **Day 4:** Audit logs (track all consent changes)
- [ ] **Day 5:** Write GDPR compliance tests

**GDPR Features:**
- [ ] Consent management (opt-in/opt-out)
- [ ] Data portability (export user data as JSON)
- [ ] Right to deletion (actually delete, not just flag)
- [ ] Audit trail (who changed what, when)
- [ ] Retention policies (auto-delete after X days)

**Verification Gate:**
- [ ] External proof: User data exports to JSON file
- [ ] Demo video: Request data export → Download JSON → Verify contents

---

#### Week 11: PaywallEngine - Real Stripe
**Objective:** Stripe checkout, webhooks, subscription management

**Tasks:**
- [ ] **Day 1:** Stripe checkout session creation
- [ ] **Day 2:** Webhook handler (handle payment events)
- [ ] **Day 3:** Subscription management (create, cancel, upgrade)
- [ ] **Day 4:** Usage tracking (meter API calls)
- [ ] **Day 5:** Write Stripe integration tests

**Stripe Flow:**
```typescript
// 1. Create checkout session
const session = await paywallEngine.createCheckoutSession({
  userId,
  planId: 'pro',
  successUrl: 'https://app.com/success',
  cancelUrl: 'https://app.com/cancel'
})

// 2. User completes payment
// 3. Stripe webhook fires
// 4. PaywallEngine updates subscription in Supabase
```

**Verification Gate:**
- [ ] External proof: Stripe webhook events logged
- [ ] Tests: Webhook signature validation works
- [ ] Demo video: Complete Stripe checkout → Subscription activated

---

#### Week 12: War Room - Real Monitoring
**Objective:** Replace TODOs with actual receipt querying

**Tasks:**
- [ ] **Day 1:** Implement `ReceiptReader` (query Supabase for receipts)
- [ ] **Day 2:** Real-time metrics (error rates, latency, costs)
- [ ] **Day 3:** Drift detection (compare current vs baseline receipts)
- [ ] **Day 4:** Alert system (Slack/email on anomalies)
- [ ] **Day 5:** Dashboard UI (visualize metrics)

**War Room Monitoring:**
```typescript
// OLD:
async getRecentReceipts(hours: number): Promise<any[]> {
  console.warn('Not implemented')
  return []
}

// NEW:
async getRecentReceipts(hours: number): Promise<Receipt[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const { data, error } = await this.supabase
    .from('receipts')
    .select('*')
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: false })

  if (error) throw error
  return data
}
```

**Verification Gate:**
- [ ] Tests: Query receipts from Supabase
- [ ] External proof: War Room dashboard shows real data
- [ ] Demo video: Trigger error → War Room detects anomaly → Alert fires

**Sprint Deliverable:** All 8 engines pass verification gates

---

## Weekly Checkpoint Format

Every Friday, run this checklist:

```markdown
## Week X Checkpoint (YYYY-MM-DD)

### Planned Tasks
- [x] Task 1: Completed ✅
- [x] Task 2: Completed ✅
- [ ] Task 3: Blocked (reason: waiting on Stripe approval)
- [x] Task 4: Completed ✅
- [ ] Task 5: Rolled to next week

### Verification Gates
- [x] Gate 1: CODE_EXISTS (no TODOs in changed files)
- [x] Gate 2: TESTS_PASS (12 new tests, 85% coverage)
- [x] Gate 3: EXTERNAL_PROOF (Supabase query confirms 5 users)
- [ ] Gate 4: DEMO_VIDEO (recording in progress)

### Blockers
1. Stripe webhook signature validation failing (investigating)
2. Supabase connection timeout in tests (using test DB now)

### Next Week Preview
1. Finish demo video
2. Fix Stripe webhook issue
3. Start OAuth implementation

### Metrics
- Tests written: 12
- Coverage: 85% (+15% from last week)
- LOC added: 347
- TODOs removed: 8
- Verified features: 1 (IdentityEngine persistence)
```

---

## Success Metrics (End of 12 Weeks)

**Target:**
- [ ] 8/8 engines pass all 4 verification gates
- [ ] 80%+ test coverage across all packages
- [ ] 0 TODOs in production code
- [ ] CI/CD green (all tests passing)
- [ ] 8 demo videos uploaded (one per engine)
- [ ] README shows 85%+ production ready

**Proof:**
- [ ] External developer review (not Jehad, someone new)
- [ ] Live demo to potential customer/investor
- [ ] Deploy to production and monitor for 1 week (no crashes)

---

## Milestone Checkpoints

### End of Sprint 1 (Week 2)
**Goal:** Foundation is solid
- ✅ README is honest (no false claims)
- ✅ Tests run in CI/CD
- ✅ Coverage reporting works

**Gate:** Can claim "40% complete, with verified testing infrastructure"

---

### End of Sprint 2 (Week 6)
**Goal:** One engine is production-ready
- ✅ IdentityEngine has Supabase persistence
- ✅ OAuth works (Google/GitHub)
- ✅ RBAC implemented
- ✅ 85% test coverage

**Gate:** Can claim "IdentityEngine is production-ready"

---

### End of Sprint 3 (Week 9)
**Goal:** TruthSerum actually verifies
- ✅ Vercel deployments verified via API
- ✅ GitHub commits verified via API
- ✅ Stripe payments verified via API

**Gate:** Can claim "TruthSerum provides cryptographic + external verification"

---

### End of Sprint 4 (Week 12)
**Goal:** All engines production-ready
- ✅ 8/8 engines pass verification gates
- ✅ War Room shows real metrics
- ✅ No mock data in production code

**Gate:** Can claim "QuietBuild OS is 85% production-ready"

---

## Anti-Patterns to Avoid

**DO NOT:**
1. ❌ Add features not on this roadmap (scope creep)
2. ❌ Skip verification gates ("we'll add tests later")
3. ❌ Self-approve PRs on critical features
4. ❌ Use "almost done" as a status (it's either done or not)
5. ❌ Update README before code works
6. ❌ Create new engines before fixing existing ones

**DO:**
1. ✅ Complete one engine before starting another
2. ✅ Write tests BEFORE marking task complete
3. ✅ Get external review on verification gates
4. ✅ Update README only after demo video is recorded
5. ✅ Focus on depth (one working engine) over breadth (8 broken engines)

---

## Emergency Protocol

**If you fall behind schedule:**

1. **Week 1-4:** Stop and reassess (adjust timeline, not scope)
2. **Week 5-8:** Cut one engine from Sprint 4 (ConfigEngine is lowest priority)
3. **Week 9-12:** Extend timeline by 2 weeks (better late than fake)

**Never sacrifice verification gates to hit a deadline.**

---

## The New Contract

**I promise:**
- ✅ Every feature will pass all 4 verification gates before claiming "complete"
- ✅ No more self-issued "Production Certificates"
- ✅ External reviewers will validate claims
- ✅ README will reflect actual state, not aspirational state
- ✅ Tests will run and pass, not print "Tests coming soon"

**You (stakeholders) can expect:**
- ✅ Honest status updates every Friday
- ✅ Working demos, not slide decks
- ✅ Incremental progress (not "99% done for 6 months")
- ✅ External proof for every claim

---

## Appendix: Week-by-Week Gantt Chart

```
Week 1:  [Truth Audit                    ] 🔴
Week 2:  [Test Infrastructure            ] 🔴
Week 3:  [IdentityEngine - Persistence   ] 🟡
Week 4:  [IdentityEngine - Security      ] 🟡
Week 5:  [IdentityEngine - OAuth         ] 🟡
Week 6:  [IdentityEngine - RBAC          ] 🟡 ✅ Milestone 1
Week 7:  [TruthSerum - Vercel            ] 🟢
Week 8:  [TruthSerum - GitHub            ] 🟢
Week 9:  [TruthSerum - Stripe            ] 🟢 ✅ Milestone 2
Week 10: [CharterEngine - GDPR           ] 🔵
Week 11: [PaywallEngine - Stripe         ] 🔵
Week 12: [War Room - Monitoring          ] 🔵 ✅ Final Delivery

Legend:
🔴 Foundation
🟡 Identity Engine
🟢 TruthSerum
🔵 Remaining Engines
```

---

**This roadmap is locked for 12 weeks. No new features. Just execution.**
