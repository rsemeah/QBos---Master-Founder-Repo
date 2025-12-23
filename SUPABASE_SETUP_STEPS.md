# Supabase Setup - Step-by-Step Execution

**Status:** Environment ready, awaiting external service setup  
**Date:** December 23, 2025  
**Required Time:** ~20 minutes  

---

## ✅ PRE-CHECK COMPLETE

```
Node: v24.11.1
Git: Working tree clean
Migration files: 4 ready
```

---

## EXTERNAL ACTIONS REQUIRED

The following steps require browser access to Supabase Dashboard. This environment cannot execute them automatically.

### Step 1: Create Project (5 minutes)

```
1. Open: https://app.supabase.com
2. Click: "New project"
3. Enter:
   - Name: rob-qbos
   - Database password: [Generate strong password, save locally]
   - Region: [Choose closest]
   - Plan: Free
4. Click: "Create new project"
5. Wait ~2 minutes for provisioning
```

**Save these values:**
```
PROJECT_URL: https://YOUR_PROJECT_ID.supabase.co
ANON_KEY: [From Settings → API → anon public]
SERVICE_ROLE_KEY: [From Settings → API → service_role]
```

---

### Step 2: Apply Rob Migration (10 minutes)

**Option A: SQL Editor (Recommended)**

```
1. Dashboard → SQL Editor
2. Click "New query"
3. Open local file: supabase/migrations/20251223000001_create_rob_tables.sql
4. Copy entire contents (408 lines)
5. Paste into SQL Editor
6. Click "Run"
7. Verify: "Success. No rows returned."
```

**Verification Query:**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'rob_%'
ORDER BY tablename;
```

**Expected Output (9 tables):**
- rob_ai_usage
- rob_config_history
- rob_messages
- rob_plans
- rob_receipts
- rob_sessions
- rob_state_transitions
- rob_undo_stack
- rob_user_entitlements

---

### Step 3: Enable Auth (2 minutes)

```
1. Dashboard → Authentication → Providers
2. Email provider:
   - Toggle: ON
   - Confirm email: Optional (OFF for testing)
   - Secure email change: OFF
3. Save
```

---

### Step 4: Configure Environment (Local)

Create `.env.local` in `apps/proof-harness/`:

```bash
cd /workspaces/QBos---Master-Founder-Repo/apps/proof-harness

cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL_GOES_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_GOES_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_GOES_HERE
EOF
```

**Then replace placeholders with real values from Step 1.**

---

### Step 5: Test Connection

```bash
cd /workspaces/QBos---Master-Founder-Repo/apps/proof-harness
npm run dev
```

Navigate to: `http://localhost:3000/rob`

**Expected Behavior:**
- ✅ No "mock mode" warning
- ✅ Session creates successfully
- ✅ Messages persist

**Verify in Dashboard:**
```
1. Dashboard → Table Editor → rob_sessions
2. Should see 1 row with your session
3. Dashboard → Table Editor → rob_receipts
4. Should see receipts (session.created, etc.)
```

---

### Step 6: Persistence Proof (CRITICAL)

**Test restart persistence:**

```bash
# While app is running, create a session at /rob
# Type a message
# Note the session ID from URL or UI

# Stop server
Ctrl+C

# Restart
npm run dev

# Query receipts
curl http://localhost:3000/api/receipts?sessionId=YOUR_SESSION_ID
```

**PASS CONDITION:**
Receipts from before restart are returned after restart.

---

## REQUIRED RECEIPTS CHECKLIST

After completing all steps, verify these receipts exist:

```sql
-- Run in Supabase SQL Editor
SELECT 
  type,
  created_at,
  details
FROM rob_receipts
ORDER BY created_at DESC
LIMIT 10;
```

**Must include:**
- [ ] session.created
- [ ] user_input_received
- [ ] gate_checked (consent)
- [ ] consent_granted
- [ ] rob_response_emitted
- [ ] state_transitioned

---

## STOP CONDITION

**DO NOT PROCEED to VERCEL until:**

✅ All 9 rob_* tables exist  
✅ Sessions persist across restarts  
✅ Receipts queryable after restart  
✅ No "mock mode" warnings in app  

---

## TROUBLESHOOTING

### Issue: "Supabase configuration missing"

**Check:**
```bash
cd apps/proof-harness
cat .env.local | grep SUPABASE
```

Should show real values, not placeholders.

### Issue: "Database error: permission denied"

**Check RLS policies:**
```sql
-- In SQL Editor
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'rob_%';
```

Should show policies. If empty, re-run migration.

### Issue: Tables don't exist

**Re-run migration:**
1. Drop all tables (if exists)
2. Re-paste migration SQL
3. Verify with SELECT tablename query

---

## NEXT COMMAND

When all receipts exist and persistence is proven, respond with:

**`VERCEL`**

Do not proceed without verified receipts.

---

**Environment Status:** Ready  
**External Actions:** Required (manual)  
**Estimated Time:** 20 minutes  
**TruthSerum:** Active
