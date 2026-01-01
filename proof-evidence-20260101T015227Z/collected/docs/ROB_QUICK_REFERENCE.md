# ⚡ Rob Quick Reference Card

**Everything you need on one page.**

---

## 🚀 Start Servers

```bash
# Terminal 1 - Backend
cd apps/proof-harness && npm run dev

# Terminal 2 - UI
cd apps/rob-ui && npm run dev

# Visit: http://localhost:3001/rob
```

---

## 🔑 Environment Variables

**Location:** `apps/proof-harness/.env.local`

```bash
# Already Configured ✅
NEXT_PUBLIC_SUPABASE_URL=https://gcpnnkdldnnnkkkwbnog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Add These for Full Functionality ⚠️

# 1. Supabase Service Role (full persistence)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Get from Supabase dashboard

# 2. OpenAI (AI code generation)
OPENAI_API_KEY=sk-...  # Get from platform.openai.com

# 3. GitHub OAuth (repo creation)
GITHUB_CLIENT_ID=...  # Create OAuth app at github.com/settings/developers
GITHUB_CLIENT_SECRET=...
NEXTAUTH_SECRET=...  # Generate: openssl rand -base64 32
```

---

## 🧪 Test Commands

### Basic Health Check
```bash
curl http://localhost:3000/api/health
```

### Create Session
```bash
curl -X POST http://localhost:3000/api/rob/init \
  -H "Content-Type: application/json" \
  -d '{"template_id":"simple-app"}'
```

### Send Message (with AI if configured)
```bash
curl -X POST http://localhost:3000/api/rob/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "message": "build a todo app"
  }'
```

---

## 📊 Database Tables (Supabase)

**9 tables in project:** `gcpnnkdldnnnkkkwbnog`

- `rob_sessions` - Active build sessions
- `rob_messages` - Conversation history
- `rob_receipts` - Audit trail
- `rob_state_transitions` - State machine log
- `rob_ai_usage` - Token counts & costs
- `rob_plans` - Subscription tiers
- `rob_user_entitlements` - User limits
- `rob_config_history` - Config changes
- `rob_undo_stack` - Rollback support

**View:** https://supabase.com/dashboard/project/gcpnnkdldnnnkkkwbnog

---

## 🎯 What Works Without Config

✅ Full UI (chat interface, status bar)  
✅ State machine (13 states)  
✅ Consent enforcement  
✅ Deterministic responses  
✅ Mock mode (no external services)

---

## 🔥 What Needs Config

⚠️ **Real AI Code Generation**  
→ Add `OPENAI_API_KEY`  
→ Restart backend  
→ Test: "build a todo app"

⚠️ **Full Database Persistence**  
→ Add `SUPABASE_SERVICE_ROLE_KEY`  
→ Restart backend  
→ Check Supabase dashboard

⚠️ **GitHub Repo Creation**  
→ Create OAuth app  
→ Add `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`  
→ Sign in at `/api/auth/signin`

---

## 📖 Detailed Guides

- **Setup:** [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)
- **Production:** [ROB_PRODUCTION_DEPLOYMENT.md](ROB_PRODUCTION_DEPLOYMENT.md)
- **Status:** [PRODUCTION_READINESS.md](../PRODUCTION_READINESS.md)
- **Rob UI:** [apps/rob-ui/README.md](../apps/rob-ui/README.md)

---

## 🚨 Troubleshooting

**Backend won't start:**
```bash
cd apps/proof-harness
rm -rf node_modules package-lock.json
npm install && npm run dev
```

**OpenAI errors:**
- Check key starts with `sk-`
- Verify billing enabled
- Check quota at platform.openai.com

**GitHub OAuth fails:**
- Verify callback URL: `http://localhost:3000/api/auth/callback/github`
- Check permissions include `repo` scope
- Regenerate client secret if needed

**Database errors:**
- Use JWT token (starts with `eyJhbG...`), not `sb_secret_*`
- Verify tables exist in Supabase dashboard
- Run: `node scripts/apply-migrations.js`

---

## 💡 Quick Tips

**Try these in Rob:**
- `I consent` → Grant CharterEngine permission
- `build a todo app` → Get React code (if OpenAI configured)
- `help` → See available commands
- `create a landing page` → Generate components

**Watch the state machine:**
- INIT → LISTENING → BUILDING → VERIFYING → READY

**Check receipts:**
- Every action logged to `rob_receipts`
- View in Supabase or via API

---

**Status:** ✅ All infrastructure ready, configure as needed!
