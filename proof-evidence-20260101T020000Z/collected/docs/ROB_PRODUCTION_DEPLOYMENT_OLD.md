# ROB THE QUIETBUILDER — PRODUCTION DEPLOYMENT GUIDE

**Date:** December 23, 2025  
**Status:** SHAPED (Database deployment pending)  
**Mode:** Production Readiness Checklist  

---

## CURRENT STATE

✅ **Rob Implementation: SHAPED**
- State machine operational (13 states)
- API routes functional (session + chat)
- UI component complete (/build page)
- TruthSerum integrated
- Receipt system wired
- Database schema designed (9 tables, 408 lines SQL)

⚠️ **Database: NOT DEPLOYED**
- Migration file ready: `supabase/migrations/20251223000001_create_rob_tables.sql`
- Requires Supabase project + CLI access
- Schema includes RLS, indexes, helper functions

⚠️ **Authentication: MOCK**
- Current: `x-user-id` header (hardcoded `mock-user-123`)
- Production requires: Supabase Auth integration

⚠️ **Billing: PLACEHOLDER**
- Database schema includes `rob_plans` + `rob_user_entitlements`
- Enforcement logic not wired in API routes

---

## PRODUCTION DEPLOYMENT CHECKLIST

### Phase 1: Supabase Setup

#### 1.1 Create Supabase Project

```bash
# Option A: Using Supabase Dashboard
1. Go to https://app.supabase.com
2. Create new project
3. Note: Project URL, Anon Key, Service Role Key

# Option B: Using Supabase CLI (if available)
supabase login
supabase projects create qbos-production --org-id YOUR_ORG_ID
supabase link --project-ref YOUR_PROJECT_REF
```

#### 1.2 Apply Database Migrations

```bash
# Option A: Via Supabase CLI
cd /workspaces/QBos---Master-Founder-Repo
supabase db push

# Option B: Via Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of supabase/migrations/20251220000001_create_sight_engine_tables.sql
3. Execute
4. Repeat for 20251220000002_create_silent_engine_tables.sql
5. Repeat for 20251220000003_seed_silent_engine_data.sql
6. Execute 20251223000001_create_rob_tables.sql (Rob schema)

# Verify migrations
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'rob_%';
-- Should return: rob_sessions, rob_messages, rob_receipts, rob_state_transitions,
--                rob_config_history, rob_undo_stack, rob_ai_usage, rob_plans,
--                rob_user_entitlements
```

#### 1.3 Configure Environment Variables

**For Development (.env.local in apps/proof-harness):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Providers (for SilentEngine)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

**For Production (Vercel Environment Variables):**
```bash
# In Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here (mark as sensitive)
ANTHROPIC_API_KEY=sk-ant-... (mark as sensitive)
```

---

### Phase 2: Authentication Integration

#### 2.1 Install Supabase Auth

```bash
cd apps/proof-harness
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

#### 2.2 Create Supabase Client

**Create `apps/proof-harness/lib/supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

#### 2.3 Update Rob API Routes

**Replace mock auth in `apps/proof-harness/app/api/rob/session/route.ts`:**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = user.id; // Use real user ID

  // ... rest of session creation logic
}
```

**Apply same pattern to `apps/proof-harness/app/api/rob/chat/route.ts`.**

#### 2.4 Add Login Page

**Create `apps/proof-harness/app/login/page.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabaseClient.auth.signInWithOtp({ email });
    if (!error) {
      alert('Check your email for the login link!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Rob Login</h1>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Send Magic Link
        </button>
      </div>
    </div>
  );
}
```

#### 2.5 Protect Rob Routes

**Update `apps/proof-harness/app/build/page.tsx` to check auth:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RobBuildPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    });
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  // ... existing Rob UI
}
```

---

### Phase 3: Billing Enforcement

#### 3.1 Seed Billing Plans

**Execute SQL in Supabase Dashboard:**
```sql
-- Insert default plans (if not already seeded by migration)
INSERT INTO rob_plans (id, name, max_sessions_per_day, max_messages_per_session, ai_budget_per_session, features)
VALUES 
  ('free', 'Free', 3, 20, 100000, '{"undo": false, "templates": ["basic"]}'::jsonb),
  ('pro', 'Pro', 50, 100, 500000, '{"undo": true, "templates": ["basic", "advanced"]}'::jsonb),
  ('team', 'Team', 500, 500, 2000000, '{"undo": true, "templates": ["basic", "advanced", "custom"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
```

#### 3.2 Create Billing Check Middleware

**Create `apps/proof-harness/app/api/rob/_middleware/billing.ts`:**
```typescript
import { SupabaseRobPersistence } from '@qbos/execution-engine-core/SupabaseRobPersistence';

export async function enforceBillingLimits(
  userId: string,
  sessionId: string,
  persistence: SupabaseRobPersistence
) {
  // Get user's plan
  const entitlement = await persistence.getUserEntitlement(userId);
  if (!entitlement) {
    throw new Error('No billing plan found for user');
  }

  // Check daily session limit
  const usage = await persistence.getAIUsageToday(userId);
  if (usage.session_count >= entitlement.max_sessions_per_day) {
    return {
      blocked: true,
      reason: 'Daily session limit reached',
      upgrade_url: '/pricing',
    };
  }

  // Check per-session message limit
  const messageCount = await persistence.getMessageCount(sessionId);
  if (messageCount >= entitlement.max_messages_per_session) {
    return {
      blocked: true,
      reason: 'Session message limit reached',
      upgrade_url: '/pricing',
    };
  }

  return { blocked: false };
}
```

#### 3.3 Wire Billing Checks into Chat API

**Update `apps/proof-harness/app/api/rob/chat/route.ts`:**
```typescript
import { enforceBillingLimits } from './_middleware/billing';

export async function POST(request: NextRequest) {
  // ... auth logic ...

  // Step 2: Billing enforcement
  const billingCheck = await enforceBillingLimits(userId, session_id, persistence);
  if (billingCheck.blocked) {
    return NextResponse.json(
      {
        ok: false,
        error: billingCheck.reason,
        upgrade_url: billingCheck.upgrade_url,
      },
      { status: 402 } // Payment Required
    );
  }

  // ... rest of chat logic ...
}
```

---

### Phase 4: Testing & Verification

#### 4.1 Local Development Test

```bash
cd apps/proof-harness

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export ANTHROPIC_API_KEY=sk-ant-...

# Run dev server
npm run dev

# Test flow:
1. Go to http://localhost:3000/login
2. Enter email, receive magic link
3. Click magic link to authenticate
4. Navigate to /build
5. Create new session
6. Send messages to Rob
7. Verify receipts in Supabase Dashboard → rob_receipts table
```

#### 4.2 Database Verification Queries

```sql
-- Check Rob tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'rob_%';

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE tablename LIKE 'rob_%';

-- Check helper functions
SELECT proname FROM pg_proc WHERE proname LIKE '%rob%';

-- Verify no sessions yet
SELECT COUNT(*) FROM rob_sessions;

-- After creating a session, verify
SELECT id, template_id, current_state, progress_percent, readiness_tier FROM rob_sessions;

-- Check receipts are being written
SELECT COUNT(*) FROM rob_receipts;
```

#### 4.3 Production Deployment (Vercel)

```bash
# Link Vercel project (if not already)
vercel link

# Set environment variables in Vercel Dashboard

# Deploy
vercel --prod

# Test production:
1. Go to your-domain.vercel.app/login
2. Authenticate
3. Test Rob build flow
4. Monitor Supabase logs for database activity
```

---

## VERIFICATION COMMANDS

### Check Database Schema

```sql
-- Verify all 9 Rob tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'rob_%'
ORDER BY tablename;

-- Expected output:
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

### Test Rob API (after deployment)

```bash
# Create session
curl -X POST https://your-domain.vercel.app/api/rob/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"template_id": "nextjs-basic"}'

# Send message
curl -X POST https://your-domain.vercel.app/api/rob/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "session_id": "SESSION_ID_FROM_ABOVE",
    "message": "Create a simple todo app with Next.js"
  }'
```

---

## KNOWN GAPS & NEXT STEPS

### What's Ready ✅
- Rob state machine (13 states, tested)
- API routes (session + chat endpoints)
- TruthSerum integration
- Receipt system
- UI component (/build page)
- Database schema (9 tables, RLS, helpers)

### What's Pending ⚠️
- **Supabase project creation** (requires account + CLI access)
- **Database migration application** (requires CLI or dashboard access)
- **Real authentication** (Supabase Auth integration)
- **Billing enforcement** (helper functions exist, API wiring needed)
- **Production testing** (end-to-end flow with real database)

### What's Unknown ⚠️
- **Performance at scale** (Rob sessions table growth, receipt volume)
- **Cost implications** (AI usage per session, database storage)
- **Undo behavior in production** (state rollback with receipt preservation)
- **Multi-tenant isolation** (RLS policies tested?)
- **Backup/recovery strategy** (Rob session data durability)

---

## DEPLOYMENT DECISION TREE

```
Are you deploying to production?
├─ Yes → Follow Phase 1-4 above
│  ├─ Have Supabase account? → Yes → Apply migrations
│  │                          → No → Create account first
│  ├─ Have AI API keys? → Yes → Set env vars
│  │                    → No → Get keys (Anthropic required)
│  └─ Ready to test? → Run verification commands
│
└─ No → Want to test locally?
   ├─ Yes → Use in-memory persistence (mock mode)
   │  └─ Comment out Supabase checks in API routes
   └─ No → Review code and plan deployment
```

---

## ROLLBACK PLAN

If production deployment fails:

1. **Database Issues:**
   ```sql
   -- Drop all Rob tables (DESTRUCTIVE)
   DROP TABLE IF EXISTS rob_user_entitlements CASCADE;
   DROP TABLE IF EXISTS rob_plans CASCADE;
   DROP TABLE IF EXISTS rob_ai_usage CASCADE;
   DROP TABLE IF EXISTS rob_undo_stack CASCADE;
   DROP TABLE IF EXISTS rob_config_history CASCADE;
   DROP TABLE IF EXISTS rob_state_transitions CASCADE;
   DROP TABLE IF EXISTS rob_receipts CASCADE;
   DROP TABLE IF EXISTS rob_messages CASCADE;
   DROP TABLE IF EXISTS rob_sessions CASCADE;
   
   -- Re-apply migration
   -- (paste contents of 20251223000001_create_rob_tables.sql)
   ```

2. **Auth Issues:**
   - Revert to mock auth temporarily
   - Debug Supabase Auth setup
   - Check JWT token validation

3. **Billing Issues:**
   - Disable billing checks (comment out in chat API)
   - Allow all requests through
   - Fix billing logic separately

---

## CONSTITUTIONAL COMPLIANCE

✅ **Receipt System:** Every action emits receipts (session.created, message.sent, state.transitioned)  
✅ **Truth Validation:** TruthSerum integrated in chat pipeline  
✅ **Audit Trail:** rob_receipts table is append-only with parent chaining  
✅ **State Machine:** All transitions validated, no invalid states possible  
✅ **Billing Caps:** Database schema supports limits, enforcement wiring needed  

---

## SUPPORT CONTACTS

**Database Issues:** Supabase Support (https://supabase.com/support)  
**AI Provider Issues:** Anthropic Support (support@anthropic.com)  
**Deployment Issues:** Vercel Support (https://vercel.com/support)  

---

**END OF ROB PRODUCTION DEPLOYMENT GUIDE**  
**Status: SHAPED → Awaiting Database Deployment**  
**Next Action: Create Supabase project + Apply migrations**
