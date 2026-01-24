# Verification Framework
**Purpose:** Prevent claiming functionality that doesn't exist
**Created:** 2026-01-24
**Status:** Active - Enforced on all PRs

---

## The Problem This Solves

**Never again will we:**
- Claim "production ready" when tests don't exist
- Mark features "complete" when they use in-memory storage
- Document integrations that aren't wired up
- Grade our own homework without external proof

---

## Verification Levels (TruthSerum 2.0)

Every feature MUST pass through 4 verification gates before claiming completion:

### Gate 1: CODE_EXISTS ✅
**Required:** Actual implementation, not TODOs or stubs

**Verification:**
```bash
# Must pass:
grep -r "TODO:" <feature-files> && exit 1  # No TODOs allowed
grep -r "STUB:" <feature-files> && exit 1  # No stubs allowed
grep -r "MOCK:" <feature-files> && exit 1  # No mock data in production code
```

**Blocking Patterns:**
- `private users: Map<string, User> = new Map()` in production engines
- `console.warn("Not implemented")`
- `return mockData`
- `// TODO: Implement X`

---

### Gate 2: TESTS_PASS ✅
**Required:** Real tests with real assertions, minimum 80% coverage

**Verification:**
```bash
# Must pass:
npm test                           # Actually runs tests
npm run test:coverage              # Coverage >80%
npm run test:integration           # Integration tests pass
```

**Requirements:**
- [ ] Unit tests for all public methods
- [ ] Integration tests for external services (DB, APIs)
- [ ] E2E tests for user-facing features
- [ ] Coverage badge in README (honest percentage)

**Example Test (IdentityEngine):**
```typescript
describe('IdentityEngine', () => {
  it('should hash passwords with bcrypt', async () => {
    const engine = new IdentityEngine(realSupabaseClient)
    const user = await engine.createUser({ email: 'test@example.com', password: 'secret' })

    // Verify password is NOT stored in plaintext
    expect(user.passwordHash).not.toBe('secret')
    expect(user.passwordHash).toMatch(/^\$2[ayb]\$.{56}$/)
  })

  it('should persist to Supabase, not in-memory', async () => {
    const engine = new IdentityEngine(realSupabaseClient)
    await engine.createUser({ email: 'test@example.com', password: 'secret' })

    // Restart engine (clears in-memory state)
    const newEngine = new IdentityEngine(realSupabaseClient)
    const user = await newEngine.getUserByEmail('test@example.com')

    // User should still exist (proves Supabase persistence)
    expect(user).toBeDefined()
  })
})
```

---

### Gate 3: EXTERNAL_PROOF ✅
**Required:** Third-party system confirms the claim

**Verification:**
Every claim must have external proof:

| Claim | Proof Required |
|-------|---------------|
| "Deployed to Vercel" | `curl https://vercel.com/api/v1/deployments/<id>` returns 200 |
| "Code pushed to GitHub" | `gh api repos/:owner/:repo/commits/<sha>` returns commit |
| "Stripe payment processed" | Stripe webhook receipt with `payment_intent.succeeded` |
| "Email sent" | SMTP logs or SendGrid API receipt |
| "User authenticated" | Supabase Auth session token validates |
| "Tests passed" | CI/CD artifacts (GitHub Actions logs) |

**Implementation (TruthSerum with actual verification):**
```typescript
// OLD (Jehad's criticism):
function verifyDeployment(receipt: Receipt): boolean {
  return receipt.type === 'deployment' // Just checks JSON exists
}

// NEW (External verification):
async function verifyDeployment(receipt: Receipt): Promise<VerificationResult> {
  // Check JSON exists
  if (receipt.type !== 'deployment') {
    return { verified: false, reason: 'Wrong receipt type' }
  }

  // Check external system (Vercel API)
  const vercelResponse = await fetch(
    `https://api.vercel.com/v13/deployments/${receipt.deploymentId}`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  )

  if (!vercelResponse.ok) {
    return { verified: false, reason: 'Deployment not found in Vercel' }
  }

  const deployment = await vercelResponse.json()

  // Verify critical fields match
  if (deployment.state !== 'READY') {
    return { verified: false, reason: `Deployment state: ${deployment.state}` }
  }

  if (deployment.url !== receipt.url) {
    return { verified: false, reason: 'URL mismatch' }
  }

  return {
    verified: true,
    externalSource: 'Vercel API',
    timestamp: new Date().toISOString(),
    proof: {
      deploymentId: deployment.uid,
      state: deployment.state,
      url: deployment.url,
      createdAt: deployment.createdAt
    }
  }
}
```

---

### Gate 4: DEMO_VIDEO ✅
**Required:** Screen recording showing feature working end-to-end

**Format:**
- **Duration:** 2-5 minutes
- **No edits:** Continuous recording (proves it works)
- **Show failure cases:** Demonstrate error handling
- **Show external verification:** Open Vercel dashboard, show GitHub commit, etc.

**Example (IdentityEngine demo):**
```
1. [00:00-00:30] Start with empty Supabase database (show SQL query: SELECT count(*) FROM users; → 0)
2. [00:30-01:00] Run CLI: `robby identity create-user --email test@example.com --password secret`
3. [01:00-01:30] Show Supabase dashboard (user appears in table, password is hashed)
4. [01:30-02:00] Restart application (prove in-memory state is cleared)
5. [02:00-02:30] Login with credentials: `robby identity login --email test@example.com`
6. [02:30-03:00] Show session token in response
7. [03:00-03:30] Verify session in Supabase dashboard
```

**Storage:** Upload to `docs/demos/<feature-name>.mp4` and link in PR

---

## Claim Validation Checklist

Before you can claim a feature is "Complete" or "Production Ready":

```markdown
- [ ] Gate 1: CODE_EXISTS - No TODOs, no in-memory storage, no mocks
- [ ] Gate 2: TESTS_PASS - 80%+ coverage, integration tests green
- [ ] Gate 3: EXTERNAL_PROOF - Third-party API confirms the claim
- [ ] Gate 4: DEMO_VIDEO - Recorded proof uploaded to docs/demos/
- [ ] Documentation updated with honest status (not aspirational)
- [ ] Peer review by external developer (not yourself)
```

**If ANY gate fails → Feature status: "In Progress"**

---

## Automated Enforcement (CI/CD)

### GitHub Actions Workflow (.github/workflows/verify-claims.yml)

```yaml
name: Verify Claims

on: [pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Gate 1: Check for blocking patterns
      - name: Gate 1 - No TODOs in production code
        run: |
          if grep -r "TODO:" packages/engines/*/core/src/*.ts; then
            echo "❌ Found TODOs in production code"
            exit 1
          fi

      - name: Gate 1 - No in-memory storage
        run: |
          if grep -r "new Map<" packages/engines/*/core/src/*.ts; then
            echo "❌ Found in-memory Maps in engines (use Supabase)"
            exit 1
          fi

      # Gate 2: Run actual tests
      - name: Gate 2 - Tests must exist and pass
        run: |
          npm test
          if [ $? -ne 0 ]; then
            echo "❌ Tests failed"
            exit 1
          fi

      - name: Gate 2 - Coverage must be >80%
        run: |
          npm run test:coverage
          # (Coverage tool will fail if <80%)

      # Gate 3: Check for demo videos
      - name: Gate 4 - Demo video must exist
        run: |
          # Extract feature name from PR title
          FEATURE=$(echo "${{ github.event.pull_request.title }}" | grep -oP '(?<=feat: ).*')
          if [ ! -f "docs/demos/${FEATURE}.mp4" ]; then
            echo "⚠️ Warning: No demo video found at docs/demos/${FEATURE}.mp4"
          fi
```

---

## Status Badges (Honest Metrics)

Replace self-issued "Production Certificates" with real badges:

```markdown
# QuietBuild OS

![Tests](https://github.com/rsemeah/QBos/workflows/Tests/badge.svg)
![Coverage](https://codecov.io/gh/rsemeah/QBos/branch/main/graph/badge.svg)
![Verified Features](https://img.shields.io/badge/verified-4%2F8%20engines-yellow)
![Production Ready](https://img.shields.io/badge/production%20ready-40%25-orange)

## Feature Status (Last Updated: 2026-01-24)

| Feature | Code | Tests | External Proof | Demo | Status |
|---------|------|-------|----------------|------|--------|
| IdentityEngine | ❌ In-memory | ❌ 0% | ❌ N/A | ❌ N/A | 🔴 **Not Ready** |
| CharterEngine | ❌ In-memory | ❌ 0% | ❌ N/A | ❌ N/A | 🔴 **Not Ready** |
| PaywallEngine | ❌ In-memory | ❌ 0% | ❌ N/A | ❌ N/A | 🔴 **Not Ready** |
| ConfigEngine | ❌ In-memory | ❌ 0% | ❌ N/A | ❌ N/A | 🔴 **Not Ready** |
| SilentEngine | ✅ Real providers | 🟡 40% | ✅ OpenAI API | ❌ N/A | 🟡 **Alpha** |
| ExecutionEngine | ✅ Supabase | 🟡 35% | ❌ N/A | ❌ N/A | 🟡 **Alpha** |
| SightEngine | ✅ Complete | 🟡 60% | ✅ Image analysis | ❌ N/A | 🟡 **Beta** |
| TruthSerum | ❌ No external verification | ❌ 0% | ❌ N/A | ❌ N/A | 🔴 **Not Ready** |

**Legend:**
- 🔴 Not Ready (0-40% complete)
- 🟡 Alpha/Beta (41-80% complete, missing critical features)
- ✅ Production (81-100% complete, all gates passed)
```

---

## Peer Review Requirement

**Rule:** You cannot verify your own claims.

**Process:**
1. Complete feature implementation
2. Pass all 4 gates locally
3. Create PR with verification checklist
4. Request review from external developer (not yourself, not AI)
5. Reviewer must:
   - Run tests locally
   - Verify external proof (call APIs, check DBs)
   - Watch demo video
   - Approve or request changes

**No self-merging on production-readiness claims.**

---

## Example: How to Claim IdentityEngine is "Complete"

### ❌ OLD WAY (What got you the D+ grade):
```markdown
## IdentityEngine™

Status: ✅ COMPLETE (~373 lines)

Features:
- Enterprise authentication
- User management
- Session handling
- RBAC support
```

### ✅ NEW WAY (Verification Framework):
```markdown
## IdentityEngine

**Status: 🔴 Not Production Ready (40% complete)**

**What Actually Works:**
- ✅ User creation (persisted to Supabase)
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Session management (JWT tokens)
- ✅ Tests: 85% coverage

**What's Missing:**
- ❌ Email verification (implemented but not tested)
- ❌ OAuth providers (Google/GitHub stubs exist)
- ❌ Rate limiting (not implemented)
- ❌ RBAC (hardcoded roles only)

**Verification Evidence:**
- 📹 Demo: [docs/demos/identity-engine.mp4](docs/demos/identity-engine.mp4)
- 🧪 Tests: [CI Run #1234](https://github.com/.../actions/runs/1234)
- 🔗 External Proof: Supabase user count = 47 (verified 2026-01-24)

**Roadmap to Production:**
1. Add email verification integration (SendGrid) - 1 week
2. Implement OAuth (using Supabase Auth) - 2 weeks
3. Add rate limiting middleware - 1 week
4. Rebuild RBAC with proper permissions - 2 weeks

**ETA: 6 weeks to production ready**
```

---

## Monthly Verification Audit

**Process:**
1. First Monday of each month, run full verification:
   ```bash
   npm run verify:all-claims
   ```

2. Script checks:
   - All "Complete" features still have passing tests
   - External integrations still respond (APIs, DBs)
   - No new TODOs added to "Complete" code
   - Coverage hasn't dropped

3. If ANY verification fails:
   - Immediately downgrade feature status
   - Create GitHub issue
   - Update README badges
   - Block new feature work until fixed

**Automation:** GitHub Action scheduled for first Monday, 9am UTC.

---

## Red Flags Checklist (For External Reviewers)

If you see these patterns, the codebase is inflating claims:

- [ ] ™ symbols on internal components
- [ ] "Production Certificate" issued by the repo owner
- [ ] Test script that doesn't run tests
- [ ] `Map<string, X>` in production engines
- [ ] TODOs in files marked "Complete"
- [ ] README longer than total LOC
- [ ] Claims of "GDPR compliance" without lawyer review
- [ ] "98% complete" without CI/CD passing
- [ ] Features marked "Verified" without external proof
- [ ] More documentation files than test files

**If >3 red flags → Codebase is in "Documentation Theater" mode.**

---

## Success Metrics

**Goal:** Close the gap between claims and reality.

**Weekly Tracking:**
```bash
# Run every Friday:
npm run metrics:honesty

# Output:
✅ Features claimed complete: 4
✅ Features with passing tests: 4 (100%)
✅ Features with external proof: 3 (75%)
✅ Features with demo videos: 2 (50%)

❌ Gap Analysis:
- 1 feature missing external proof → PaywallEngine (no Stripe receipts)
- 2 features missing demo videos → ConfigEngine, NotificationsEngine

Action Items:
1. Create Stripe integration test for PaywallEngine
2. Record demo videos for ConfigEngine and NotificationsEngine
```

---

## The New Standard

**Before claiming anything:**

1. Ask: "Can Jehad verify this in 5 minutes?"
2. Ask: "Would this claim hold up in court?"
3. Ask: "Can a stranger reproduce this from the README?"

If the answer is "no" to any question → Don't claim it yet.

---

## Appendix: Verification Test Template

```typescript
// tests/verification/<engine-name>.verify.ts

import { test, expect } from 'vitest'
import { IdentityEngine } from '@qbos/identity-engine'

/**
 * VERIFICATION TESTS
 * These tests verify the feature actually works as claimed.
 * They run against REAL external systems (Supabase, not mocks).
 */

test('VERIFY: Users persist to Supabase (not in-memory)', async () => {
  const engine = new IdentityEngine(process.env.SUPABASE_URL!)

  // Create user
  const user = await engine.createUser({
    email: 'verify@example.com',
    password: 'test123'
  })

  // Destroy the engine (clears in-memory state)
  // @ts-ignore
  engine = null

  // Create NEW engine instance
  const newEngine = new IdentityEngine(process.env.SUPABASE_URL!)

  // User should still exist (proves Supabase persistence)
  const retrieved = await newEngine.getUserByEmail('verify@example.com')
  expect(retrieved).toBeDefined()
  expect(retrieved?.id).toBe(user.id)
})

test('VERIFY: Passwords are hashed with bcrypt', async () => {
  const engine = new IdentityEngine(process.env.SUPABASE_URL!)

  const user = await engine.createUser({
    email: 'hash-test@example.com',
    password: 'plaintext-password'
  })

  // Password should NOT be stored in plaintext
  expect(user.passwordHash).not.toBe('plaintext-password')

  // Should be bcrypt hash format: $2a$12$...
  expect(user.passwordHash).toMatch(/^\$2[ayb]\$\d{2}\$.{53}$/)
})

test('VERIFY: External API confirms user exists', async () => {
  // This test calls Supabase API directly (not through our code)
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/users?email=eq.verify@example.com`,
    {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`
      }
    }
  )

  const users = await response.json()
  expect(users.length).toBeGreaterThan(0)
})
```

---

**This framework is now the law. Any PR that violates it gets blocked.**
