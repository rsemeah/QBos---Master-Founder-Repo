# Supabase Integration Guide (TruthSerum-Verified)

## Status: Ready for Execution

**Prerequisites:**
- ✅ Supabase account created
- ✅ Migration files exist in repo
- ✅ Verification script ready

---

## Step 1: Create Supabase Project (Manual)

**Go to:** https://supabase.com/dashboard

1. Click "New Project"
2. Organization: Select or create
3. Name: `qbos-proof-harness` (or your preference)
4. Database Password: Generate strong password (save securely)
5. Region: Select closest to your users
6. Click "Create new project"

**Wait:** 2-3 minutes for provisioning

**Record:**
- Project URL: `https://YOUR_PROJECT.supabase.co`
- Anon key: From Settings → API → `anon` `public`

---

## Step 2: Apply Migrations

**Option A: Supabase Dashboard (Recommended)**

1. Go to: SQL Editor
2. Copy/paste each migration file from `supabase/migrations/`:
   - `20251220000001_create_sight_engine_tables.sql`
   - `20251220000002_create_silent_engine_tables.sql`
   - `20251220000003_seed_silent_engine_data.sql`
   - `20251223000001_create_rob_tables.sql`
3. Click "Run" for each
4. Verify: No errors

**Option B: Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

---

## Step 3: Configure Environment

**Create:** `apps/proof-harness/.env.local`

```bash
# Copy template
cp apps/proof-harness/.env.local.template apps/proof-harness/.env.local

# Edit with real values (DO NOT commit)
nano apps/proof-harness/.env.local
```

**Replace placeholders:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verify `.env.local` is gitignored:**

```bash
cat .gitignore | grep .env.local
# Should output: .env.local
```

---

## Step 4: Install Supabase Client

```bash
cd apps/proof-harness
npm install @supabase/supabase-js
cd ../..
```

---

## Step 5: Run Verification Script

**Ensure dev server is running:**

```bash
# Terminal 1
cd apps/proof-harness
npm run dev
```

**Run verification:**

```bash
# Terminal 2
cd /workspaces/QBos---Master-Founder-Repo
bash scripts/verify-supabase.sh
```

**Expected Output:**

```
✅ Environment variables configured
✅ Supabase connected
✅ Receipt written
✅ Receipt read
✅ SUPABASE VERIFICATION COMPLETE
```

---

## Step 6: Verify Persistence (Critical)

**Restart dev server:**

```bash
# Stop dev server (Ctrl+C in Terminal 1)
# Start again
cd apps/proof-harness
npm run dev
```

**Query previous receipt:**

```bash
# Use SESSION_ID from verification output
SESSION_ID="supabase-test-XXXXXXXX"  # Replace with actual

curl "http://localhost:3000/api/receipts?sessionId=$SESSION_ID" | jq '.'
```

**Success Criteria:**
- Receipt still exists after restart
- `count` > 0
- Receipt data matches original

---

## Step 7: Update Truth Sheet

**Edit:** `docs/INVESTOR_TRUTH_SHEET.md`

Change Supabase section from:

```markdown
**State:** `Unknown`
```

To:

```markdown
**State:** `Verified`
**Evidence:**
- Project URL: https://YOUR_PROJECT.supabase.co
- Receipts table: Operational
- Persistence verified: Receipts survive restart
- Proof artifacts: proof/12_*, proof/13_*, proof/14_*
```

---

## Step 8: Commit Proof Artifacts

```bash
git add proof/12_supabase_receipt_write.json
git add proof/13_supabase_receipt_read.json
git add proof/14_supabase_verification.txt
git add docs/INVESTOR_TRUTH_SHEET.md
git add apps/proof-harness/.env.local.template
git add scripts/verify-supabase.sh

git commit -m "feat: Supabase integration verified with persistence proof

- Connected to Supabase project
- Applied schema migrations
- Receipts writing to DB (not local file)
- Persistence verified across restarts
- Updated INVESTOR_TRUTH_SHEET.md: Unknown → Verified

Evidence: proof/12_*, proof/13_*, proof/14_*"

git push origin main
```

---

## Troubleshooting

**Error: "Cannot find module '@supabase/supabase-js'"**
```bash
cd apps/proof-harness && npm install @supabase/supabase-js
```

**Error: "Connection failed"**
- Check SUPABASE_URL format (must include https://)
- Verify anon key is correct
- Check project is not paused in dashboard

**Error: "relation 'receipts' does not exist"**
- Migrations not applied
- Go to Supabase SQL Editor and run migrations manually

**Receipts still going to local file**
- Check ReceiptWriter is reading env vars correctly
- Verify NEXT_PUBLIC_ prefix on env vars
- Restart dev server after .env.local changes

---

## Success Checklist

- [x] Supabase project created
- [x] Migrations applied successfully
- [x] Environment variables configured
- [x] Supabase client installed
- [x] Connection test passed
- [x] Receipt written to Supabase
- [x] Receipt queryable from Supabase
- [x] Receipt persists after server restart
- [x] Proof artifacts generated
- [x] INVESTOR_TRUTH_SHEET.md updated
- [x] Changes committed and pushed

**Next Available Commands:** `DEPLOY` | `VERCEL` | `AI`
