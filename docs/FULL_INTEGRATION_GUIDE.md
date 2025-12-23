# Full Integration Guide
## Moving All Engines from Unknown → Verified

### Phase 1: Environment Setup ✅

**Check installed tools:**
```bash
which vercel
which supabase
node --version
```

**Required credentials:**
- GitHub: ✅ Already connected
- Vercel account + token
- Supabase project URL + anon key
- OpenAI or Anthropic API key

---

### Phase 2: Vercel Deployment

**Step 1: Install Vercel CLI**
```bash
npm i -g vercel
```

**Step 2: Login**
```bash
vercel login
```

**Step 3: Deploy proof-harness**
```bash
cd /workspaces/QBos---Master-Founder-Repo
vercel deploy apps/proof-harness --prod
```

**Expected Output:**
```
✅ Production: https://qbos-proof-harness.vercel.app
```

**Step 4: Verify deployment**
```bash
curl https://<your-url>/api/health
```

**Step 5: Write deployment receipt**
```bash
curl -X POST https://<your-url>/api/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "vercel.deploy_success",
    "details": {
      "url": "https://<your-url>",
      "timestamp": "'$(date -Iseconds)'",
      "environment": "production"
    }
  }'
```

---

### Phase 3: Supabase Connection

**Step 1: Create Supabase project**
- Go to: https://supabase.com/dashboard
- Create new project
- Get: Project URL + anon key

**Step 2: Set environment variables**
```bash
# In Vercel dashboard or .env.local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 3: Run migrations**
```bash
# Option A: Using Supabase CLI
cd /workspaces/QBos---Master-Founder-Repo
supabase db push

# Option B: Manual via Supabase dashboard SQL editor
# Copy/paste contents of: supabase/migrations/*.sql
```

**Step 4: Test connection**
```bash
curl -X POST https://<your-url>/api/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "supabase.connected",
    "details": {
      "connected": true,
      "timestamp": "'$(date -Iseconds)'"
    }
  }'
```

**Step 5: Verify receipts in Supabase**
- Go to Supabase dashboard → Table Editor → receipts table
- Should see receipts appearing

---

### Phase 4: AI Provider Integration

**Step 1: Choose provider**
- OpenAI (recommended): https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/

**Step 2: Set environment variable**
```bash
# In Vercel dashboard:
OPENAI_API_KEY=sk-proj-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

**Step 3: Update SilentEngine to use real provider**

Edit: `packages/runtime/orchestrator.ts`

Replace mock generation with:
```typescript
import { SilentEngine } from '@qbos/silent-engine-core';

// In generateDraftResponse():
const silent = new SilentEngine({
  openaiApiKey: process.env.OPENAI_API_KEY,
});

const draftResponse = await silent.generate({
  prompt: message.content,
  maxTokens: 500,
});
```

**Step 4: Redeploy**
```bash
vercel deploy apps/proof-harness --prod
```

**Step 5: Test AI generation**
```bash
curl -X POST https://<your-url>/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-'$(date +%s)'",
    "userId": "integration-test",
    "message": "Create a simple React button component"
  }'
```

---

### Phase 5: Receipt Generation & Verification

**Step 1: Create test session**
```bash
SESSION_ID="integration-$(date +%s)"

curl -X POST https://<your-url>/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "integration-test",
    "templateId": "saas-starter",
    "appName": "Integration Test App"
  }' | jq -r '.sessionId' > /tmp/session_id

SESSION_ID=$(cat /tmp/session_id)
echo "Session: $SESSION_ID"
```

**Step 2: Generate receipts for all intents**
```bash
# Identity
curl -X POST https://<your-url>/api/receipts \
  -d '{"sessionId":"'$SESSION_ID'","type":"identity.authenticated","details":{"userId":"integration-test"}}'

# Billing
curl -X POST https://<your-url>/api/receipts \
  -d '{"sessionId":"'$SESSION_ID'","type":"billing.active","details":{"plan":"pro"}}'

curl -X POST https://<your-url>/api/receipts \
  -d '{"sessionId":"'$SESSION_ID'","type":"billing.cap_not_exceeded","details":{"usage":10,"limit":100}}'

# Safety
curl -X POST https://<your-url>/api/receipts \
  -d '{"sessionId":"'$SESSION_ID'","type":"safety.passed","details":{"checks":["content","prompt"]}}'

# Session
curl -X POST https://<your-url>/api/receipts \
  -d '{"sessionId":"'$SESSION_ID'","type":"session.created","details":{"timestamp":"'$(date -Iseconds)'"}}'
```

**Step 3: Evaluate all intents**
```bash
for intent in "session.ready" "rob.ready" "deploy.ready" "deploy.completed"; do
  echo "Evaluating: $intent"
  curl -X POST https://<your-url>/api/truth/evaluate \
    -H "Content-Type: application/json" \
    -d '{"intentId":"'$intent'","sessionId":"'$SESSION_ID'"}' | jq '.evaluation.state'
done
```

**Step 4: Count receipts**
```bash
curl https://<your-url>/api/receipts?sessionId=$SESSION_ID | jq '.count'
# Target: 100+ receipts across all engine types
```

**Step 5: Update Investor Truth Sheet**
```bash
# Fetch latest evaluations
curl -X POST https://<your-url>/api/truth/evaluate \
  -d '{"intentId":"session.ready"}' > /tmp/session_eval.json

curl -X POST https://<your-url>/api/truth/evaluate \
  -d '{"intentId":"deploy.completed"}' > /tmp/deploy_eval.json

# Update docs/INVESTOR_TRUTH_SHEET.md with:
# - Verified deployment URL
# - Verified Supabase connection
# - Verified AI generation
# - Receipt counts
```

---

### Phase 6: Final Verification

**Step 1: Run TruthGate**
```bash
cd /workspaces/QBos---Master-Founder-Repo
npm run truthgate
```

**Step 2: Check all engine states**
```bash
curl https://<your-url>/api/receipts | jq '[.receipts[].type] | group_by(.) | map({type: .[0], count: length})'
```

**Step 3: Update INVESTOR_TRUTH_SHEET.md**

Change status from Unknown → Verified for:
- ✅ Production deployment
- ✅ Supabase connection
- ✅ Real AI generation
- ✅ Receipt storage in DB

**Step 4: Commit updated truth sheet**
```bash
git add docs/INVESTOR_TRUTH_SHEET.md
git commit -m "docs: Update truth sheet with verified integrations"
git push origin main
```

---

## Success Criteria

✅ Vercel deployment accessible at public URL  
✅ Health check returns 200  
✅ Supabase receipts table has records  
✅ AI generation produces real completions  
✅ All 4 intents evaluate to "Verified"  
✅ 100+ receipts generated  
✅ INVESTOR_TRUTH_SHEET.md updated with proof  
✅ TruthGate passes  

---

## Troubleshooting

**Vercel deployment fails:**
- Check build logs in Vercel dashboard
- Verify package.json scripts
- Ensure all dependencies installed

**Supabase connection fails:**
- Verify URL and key format
- Check project is not paused
- Test with Supabase client directly

**AI generation fails:**
- Verify API key is valid
- Check rate limits
- Test provider API directly

**Receipts not appearing:**
- Check ReceiptWriter logs
- Verify Supabase config
- Fall back to local receipts temporarily

---

**Ready to start?** Run the commands in order, starting with Phase 1.
