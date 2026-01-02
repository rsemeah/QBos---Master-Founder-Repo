# 🚀 Complete Setup Guide - Rob the QuietBuilder

**All infrastructure is ready. Follow these steps to enable full functionality.**

---

## ✅ What's Already Working

- Rob UI on port 3001
- Backend API on port 3000
- Database schema deployed to Supabase
- State machine operational
- Consent enforcement working

---

## 🔧 Configuration Steps (Choose What You Need)

### Option 1: Local Development (No External Services)

**What works:**
- ✅ Full UI/UX
- ✅ State machine
- ✅ Consent flow
- ✅ Deterministic responses

**What doesn't:**
- ❌ Real AI code generation
- ❌ GitHub repo creation
- ❌ Database persistence

**No setup required** - just run the servers!

---

### Option 2: AI Code Generation (15 minutes)

**Enables:** Real code generation with GPT-4

**Steps:**

1. **Get OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-...`)

2. **Add to Environment:**
   ```bash
   # Edit apps/proof-harness/.env.local
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Restart Backend:**
   ```bash
   # Stop current server (Ctrl+C)
   cd apps/proof-harness
   npm run dev
   ```

4. **Test:**
   - Visit http://localhost:3001/rob
   - Type: "I consent"
   - Type: "build a todo app"
   - See real React code generated!

---

### Option 3: GitHub Integration (20 minutes)

**Enables:** Push generated code to GitHub repos

**Steps:**

1. **Create GitHub OAuth App:**
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Fill in:
     - App name: `Rob the QuietBuilder`
     - Homepage: `http://localhost:3000`
     - Callback: `http://localhost:3000/api/auth/callback/github`
   - Click "Register application"
   - Copy Client ID and generate Client Secret

2. **Add to Environment:**
   ```bash
   # Edit apps/proof-harness/.env.local
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   NEXTAUTH_SECRET=generate-random-string-here
   ```

   Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

3. **Restart Backend:**
   ```bash
   cd apps/proof-harness
   npm run dev
   ```

4. **Test:**
   - Visit http://localhost:3000/api/auth/signin
   - Sign in with GitHub
   - Grant repo permissions
   - Now Rob can create repos with your generated code!

---

### Option 4: Full Supabase Persistence (10 minutes)

**Enables:** Real database persistence (not just mock mode)

**Steps:**

1. **Get Service Role Key:**
   - Go to https://supabase.com/dashboard/project/gcpnnkdldnnnkkkwbnog
   - Click Settings → API
   - Find "service_role" key (NOT the anon key)
   - Copy the JWT (long token starting with `eyJhbGciOi...`)

2. **Add to Environment:**
   ```bash
   # Edit apps/proof-harness/.env.local
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-jwt-here
   ```

3. **Verify Tables Exist:**
   ```bash
   # Should already be applied, but verify:
   cd /workspaces/QBos---Master-Founder-Repo
   node scripts/apply-migrations.js
   ```

4. **Restart Backend:**
   ```bash
   cd apps/proof-harness
   npm run dev
   ```

5. **Test:**
   - Visit http://localhost:3001/rob
   - Interact with Rob
   - Check Supabase dashboard - you'll see real data!

---

## 📝 Complete .env.local Example

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://gcpnnkdldnnnkkkwbnog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...jwt-here

# OpenAI (for AI code generation)
OPENAI_API_KEY=sk-...your-key

# GitHub OAuth (for repo creation)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=random-32-char-string

# Other AI Providers (optional)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
MISTRAL_API_KEY=...
```

---

## 🎯 Quick Test Commands

### Test AI Generation
```bash
curl -X POST http://localhost:3000/api/rob/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "message": "build a simple counter app"
  }'
```

### Test GitHub Integration (requires auth)
```bash
curl -X POST http://localhost:3000/api/github/create-repo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "session_id": "test-123",
    "repo_name": "rob-test-app",
    "files": [{
      "path": "index.tsx",
      "content": "export default function App() { return <div>Hello</div>; }"
    }]
  }'
```

---

## 🔍 Troubleshooting

### "OpenAI generation failed"
- Check API key is valid
- Verify key starts with `sk-`
- Check OpenAI dashboard for quota/billing

### "GitHub authentication required"
- Make sure OAuth app is created
- Verify callback URL matches
- Check CLIENT_ID and CLIENT_SECRET are correct

### "Supabase error"
- Verify SERVICE_ROLE_KEY is the JWT, not `sb_secret_*`
- Check tables exist in dashboard
- Run migration script if needed

### Backend won't start
```bash
# Clear everything and reinstall
cd apps/proof-harness
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 What's Logged to Supabase

When all configured:

**rob_sessions:**
- Session state, progress, app config

**rob_messages:**
- Full conversation history

**rob_receipts:**
- Every action (consent, AI generation, repo creation)

**rob_ai_usage:**
- Token counts, costs, latency

**rob_state_transitions:**
- State machine changes with reasons

---

## 🎉 You're Ready!

Choose your configuration level:
- **Minimum:** Nothing - UI works with fallbacks
- **Recommended:** OpenAI + Supabase service key
- **Full Power:** All 4 options above

Start servers and test:
```bash
# Terminal 1
cd apps/proof-harness && npm run dev

# Terminal 2  
cd apps/rob-ui && npm run dev

# Visit http://localhost:3001/rob
```

**Questions?** Check [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md) for full details.
