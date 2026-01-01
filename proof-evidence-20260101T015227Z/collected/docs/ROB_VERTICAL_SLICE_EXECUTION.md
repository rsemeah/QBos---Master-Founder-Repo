# ROB VERTICAL SLICE — EXECUTION CHECKLIST

**Date:** December 23, 2025  
**Status:** Code Ready → External Services Needed  
**Mode:** File-by-File Execution Plan  

---

## WHAT WAS BUILT (CODE COMPLETE)

### 1. Minimal Rob UI ✅

**File:** `apps/proof-harness/app/rob/page.tsx` (existing, will be replaced)  
**Purpose:** Simple chat interface, no AI, deterministic responses  
**Features:**
- Session initialization
- Message input/display
- State/progress/consent tracking
- Mock mode fallback (works without Supabase)

### 2. Session Init API ✅

**File:** `apps/proof-harness/app/api/rob/init/route.ts`  
**Purpose:** Create Rob session with receipts  
**Constitutional guarantees:**
- Emits `session.created` receipt
- Stores session in `rob_sessions` table
- Creates initial messages
- Falls back to mock if no Supabase

### 3. Message Handler API ✅

**File:** `apps/proof-harness/app/api/rob/message/route.ts`  
**Purpose:** Handle user messages with CharterEngine consent gate  
**Constitutional guarantees:**
- Persists user messages
- Enforces consent via CharterEngine
- Emits `gate_checked`, `consent_granted` receipts
- Generates deterministic responses
- Transitions state
- Emits `rob_response_emitted`, `state_transitioned` receipts

### 4. Supabase Client ✅

**Package:** `@supabase/supabase-js` (installed)  
**Usage:** Direct client creation in API routes  
**Fallback:** Mock mode if env vars missing

### 5. Route Manifest ✅

**File:** `packages/runtime/route-manifest.ts`  
**Updated:** Added `/rob`, `/api/rob/init`, `/api/rob/message`

---

## WHAT CAN BE TESTED NOW (MOCK MODE)

### Local Test Without Supabase

```bash
cd apps/proof-harness

# No env vars needed for mock mode
npm run dev

# Navigate to http://localhost:3000/rob
# Expected behavior:
# 1. Session initializes (mock mode warning shown)
# 2. Can type messages
# 3. Consent prompt appears
# 4. After typing "I consent", can interact
# 5. Responses are deterministic
# 6. Receipts logged to console (not persisted)
```

**What this proves:**
- ✅ UI works
- ✅ API routes respond
- ✅ State transitions happen
- ✅ Consent gate enforces
- ⚠️ Receipts NOT persisted (mock mode)

---

## WHAT REQUIRES EXTERNAL SERVICES

### Phase 1: Real Database (Supabase)

#### Step 1.1: Create Supabase Project

```bash
# Go to https://app.supabase.com
# Click "New project"
# Name: qbos-rob-vertical-slice
# Database password: (generate strong password)
# Region: (choose closest)
# Plan: Free tier is sufficient
# Wait ~2 minutes for provisioning
```

#### Step 1.2: Apply Database Migration

```bash
# Option A: Via SQL Editor (Dashboard)
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Paste contents of: supabase/migrations/20251223000001_create_rob_tables.sql
4. Click "Run"
5. Verify: "Success. Rows: 0" (tables created)

# Option B: Via Supabase CLI (if available)
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

#### Step 1.3: Verify Database

```sql
-- Run in SQL Editor
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'rob_%'
ORDER BY tablename;

-- Expected output (9 tables):
-- rob_ai_usage
-- rob_config_history
-- rob_messages
-- rob_plans
-- rob_receipts
-- rob_sessions
-- rob_state_transitions
-- rob_undo_stack
-- rob_user_entitlements
```

#### Step 1.4: Configure Environment

```bash
# Create apps/proof-harness/.env.local
cat > apps/proof-harness/.env.local << 'EOF'
# Supabase (required for receipt persistence)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-dashboard

# AI (optional for this vertical slice)
# ANTHROPIC_API_KEY=sk-ant-...
EOF

# Get keys from Dashboard:
# Settings → API → Project URL
# Settings → API → anon public (copy)
# Settings → API → service_role (copy, mark as secret)
```

#### Step 1.5: Test With Real Database

```bash
cd apps/proof-harness
npm run dev

# Navigate to http://localhost:3000/rob
# Expected behavior:
# 1. No mock mode warning
# 2. Session creates successfully
# 3. Messages persist
# 4. Consent gate enforces
# 5. Receipts visible in Dashboard → Database → rob_receipts table
```

**Verification queries:**

```sql
-- Check sessions
SELECT id, user_id, current_state, progress_percent, 
       app_config->>'consent_granted' as consent_granted
FROM rob_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- Check receipts
SELECT type, details, created_at 
FROM rob_receipts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check messages
SELECT role, LEFT(content, 50) as content_preview, created_at
FROM rob_messages
ORDER BY created_at DESC
LIMIT 10;
```

**Success criteria:**
- ✅ At least 1 session exists
- ✅ At least 3 receipts emitted (session.created, user_input_received, gate_checked)
- ✅ Messages persist across page refresh
- ✅ Consent state persists

---

### Phase 2: Deployment (Vercel)

#### Step 2.1: Prepare for Deployment

```bash
# Ensure build works
cd apps/proof-harness
npm run build

# Expected: Build completes without errors
```

#### Step 2.2: Deploy to Vercel

```bash
# Option A: Via Vercel CLI
npm install -g vercel
vercel login
vercel link  # Link to existing project or create new
vercel --prod

# Option B: Via Vercel Dashboard
1. Go to https://vercel.com
2. Import Git Repository
3. Select QBos---Master-Founder-Repo
4. Root Directory: apps/proof-harness
5. Framework Preset: Next.js
6. Click "Deploy"
```

#### Step 2.3: Configure Environment Variables in Vercel

```bash
# Via Vercel Dashboard:
# Project → Settings → Environment Variables

# Add:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (mark as sensitive)

# Redeploy after adding env vars
```

#### Step 2.4: Test Production Deployment

```bash
# Navigate to: https://your-domain.vercel.app/rob

# Complete one full session:
1. Initialize session
2. Grant consent
3. Interact with Rob
4. Verify receipts in Supabase Dashboard
```

**Success criteria:**
- ✅ Deployed URL accessible
- ✅ Session creates in production database
- ✅ Receipts persist
- ✅ CharterEngine blocks until consent granted

---

## CONSTITUTIONAL PROOF CRITERIA

After completing Phase 1 + 2, you can TRUTHFULLY claim:

✅ **Rob exists as a runtime actor**
- Evidence: Session record in `rob_sessions` with user_id, state, progress

✅ **Receipts persist (Memory)**
- Evidence: Rows in `rob_receipts` table with session_id, type, details, timestamp

✅ **Consent is enforced (CharterEngine)**
- Evidence: `gate_checked` receipt with outcome='blocked' before consent
- Evidence: `consent_granted` receipt after user types "I consent"
- Evidence: `app_config->>'consent_granted'` = 'true' in session

✅ **State transitions are tracked (Truth)**
- Evidence: `state_transitioned` receipts with from/to states
- Evidence: `current_state` updates in `rob_sessions` table

✅ **System is deployed (Perception)**
- Evidence: Live URL
- Evidence: Screenshot of Rob UI
- Evidence: Session ID from production

---

## WHAT REMAINS UNKNOWN (ACCEPTABLE)

⚠️ **AI Generation:** Not wired (deterministic responses only)  
⚠️ **Billing Enforcement:** Schema exists, not wired in API  
⚠️ **Real Authentication:** Mock user ID still used  
⚠️ **SightEngine Validation:** Receipt emitted, but no real validation  
⚠️ **Multi-Engine Orchestration:** Only CharterEngine wired  
⚠️ **Code Deployment:** Not implemented  

**These are FUTURE work, not blockers for vertical slice proof.**

---

## STOP CONDITION

When this checklist is complete:

```sql
-- Run this query to verify readiness
SELECT 
  (SELECT COUNT(*) FROM rob_sessions) as sessions_created,
  (SELECT COUNT(*) FROM rob_receipts WHERE type = 'session.created') as session_receipts,
  (SELECT COUNT(*) FROM rob_receipts WHERE type = 'consent_granted') as consent_receipts,
  (SELECT COUNT(*) FROM rob_receipts WHERE type = 'state_transitioned') as state_receipts,
  CASE 
    WHEN (SELECT COUNT(*) FROM rob_sessions) > 0 
     AND (SELECT COUNT(*) FROM rob_receipts WHERE type = 'consent_granted') > 0
    THEN 'VERIFIED'
    ELSE 'UNKNOWN'
  END as rob_status;

-- Expected output:
-- sessions_created: 1+
-- session_receipts: 1+
-- consent_receipts: 1+
-- state_receipts: 2+
-- rob_status: VERIFIED
```

**You stop adding features. You document what was proven.**

---

## ROLLBACK PLAN

If something breaks:

### Supabase Issues

```sql
-- Drop all Rob tables
DROP TABLE IF EXISTS rob_user_entitlements CASCADE;
DROP TABLE IF EXISTS rob_plans CASCADE;
DROP TABLE IF EXISTS rob_ai_usage CASCADE;
DROP TABLE IF EXISTS rob_undo_stack CASCADE;
DROP TABLE IF EXISTS rob_config_history CASCADE;
DROP TABLE IF EXISTS rob_state_transitions CASCADE;
DROP TABLE IF EXISTS rob_receipts CASCADE;
DROP TABLE IF EXISTS rob_messages CASCADE;
DROP TABLE IF EXISTS rob_sessions CASCADE;

-- Re-run migration
-- (paste contents of 20251223000001_create_rob_tables.sql)
```

### API Issues

```bash
# Check API route logs
cd apps/proof-harness
npm run dev

# Terminal will show errors
# Common issues:
# - Missing env vars (check .env.local)
# - Supabase connection (check URL/keys)
# - Table not found (re-run migration)
```

### Build Issues

```bash
# Clear Next.js cache
cd apps/proof-harness
rm -rf .next
npm run build
```

---

## TIME ESTIMATES (GUIDANCE ONLY)

- **Mock mode test:** 5 minutes
- **Supabase project creation:** 5 minutes
- **Database migration:** 10 minutes
- **Environment config:** 5 minutes
- **Real database test:** 10 minutes
- **Vercel deployment:** 15 minutes
- **Production verification:** 10 minutes

**Total:** ~1 hour for complete vertical slice proof

---

## FINAL RECEIPT STRUCTURE

After completion, create `docs/ROB_VERTICAL_SLICE_RECEIPTS.md`:

```markdown
# Rob Vertical Slice — Verification Receipts

**Deployment Date:** [DATE]
**Deployed URL:** [VERCEL_URL]
**Supabase Project:** [PROJECT_ID]

## Proof Artifacts

**Session ID:** [UUID from rob_sessions]
**Screenshot:** [Link to screenshot]

## Receipt Evidence

SELECT * FROM rob_receipts WHERE session_id = '[UUID]';

- session.created: [TIMESTAMP]
- user_input_received: [TIMESTAMP]
- gate_checked (blocked): [TIMESTAMP]
- consent_granted: [TIMESTAMP]
- rob_response_emitted: [TIMESTAMP]
- state_transitioned: [TIMESTAMP]

## TruthSerum Verdict

- Rob runtime actor: VERIFIED
- Receipt persistence: VERIFIED
- Consent enforcement: VERIFIED
- State transitions: VERIFIED
- Deployment: VERIFIED

## What Remains Unknown

- AI generation
- Billing enforcement
- Real auth
- Multi-engine orchestration
```

---

**END OF EXECUTION CHECKLIST**  
**Status: Code Complete → Awaiting External Services**  
**Next Action: Create Supabase project (5 minutes)**
