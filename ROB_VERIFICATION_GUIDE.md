# Rob Verification Guide

This guide walks through verifying that Rob is working correctly.

## Quick Verification (2 minutes)

### 1. Check Database Schema
```bash
cd /workspaces/QBos---Master-Founder-Repo
npm run supabase:verify
```

**Expected output:**
```
✅ rob_sessions table exists
✅ rob_messages table exists
✅ rob_receipts table exists
✅ rob_state_transitions table exists
✅ rob_config_history table exists
✅ rob_undo_stack table exists
✅ rob_ai_usage table exists
✅ rob_plans table exists (3 plans: free, pro, team)
✅ rob_user_entitlements table exists
✅ All RLS policies enabled
```

### 2. Check Engine Integration
```bash
# Verify Rob is in the engine registry
grep -A 10 "rob:" packages/runtime/context.ts
```

**Expected output:**
```typescript
rob: {
  key: "rob",
  name: "RobEngine",
  description: "Rob the QuietBuilder - AI-powered code generation...",
  status: "active",
  receiptTypes: [ ... 10 types ... ]
}
```

### 3. Start the App
```bash
cd apps/proof-harness
npm run dev
```

**Expected:**
- Server starts on http://localhost:3000
- No errors in console

### 4. Check UI Pages

**Home Page:**
- Visit http://localhost:3000
- Look for "👷 Rob the QuietBuilder" card
- **Expected:** Card appears with operational status

**Engine List:**
- Visit http://localhost:3000/engines
- Look for RobEngine in the list
- **Expected:** Rob shows as "operational"

**Rob Detail Page:**
- Visit http://localhost:3000/engines/rob
- **Expected:** Shows 8 capabilities, 3 API endpoints, receipt history

## Full End-to-End Test (5 minutes)

### Test 1: Initialize Session

```bash
curl -X POST http://localhost:3000/api/rob/init \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "blank",
    "appName": "Test App"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "state": "INIT",
  "receipts": [
    { "type": "rob.session.created", ... }
  ]
}
```

**Verify in database:**
```bash
# Query rob_sessions table
npm run supabase:query "SELECT * FROM rob_sessions ORDER BY created_at DESC LIMIT 1;"
```

### Test 2: Send Message

```bash
# Use sessionId from Test 1
curl -X POST http://localhost:3000/api/rob/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID_HERE",
    "message": "Build me a simple counter app in React"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "reply": "I'll help you build a counter app...",
  "state": "LISTENING",
  "receipts": [
    { "type": "rob.message.received", ... },
    { "type": "rob.message.sent", ... },
    { "type": "rob.ai.invoked", ... }
  ]
}
```

**Verify AI was called:**
```bash
# Check rob_ai_usage table
npm run supabase:query "SELECT provider, model, tokens_in, tokens_out FROM rob_ai_usage ORDER BY created_at DESC LIMIT 1;"
```

**Expected:**
- provider: "openai"
- model: "gpt-4" or "gpt-4-turbo"
- tokens_in: > 0
- tokens_out: > 0

### Test 3: Verify Receipts

```bash
# Check receipts were created
npm run supabase:query "
  SELECT type, created_at 
  FROM rob_receipts 
  WHERE session_id = 'YOUR_SESSION_ID_HERE' 
  ORDER BY created_at;
"
```

**Expected receipts (in order):**
1. `rob.session.created`
2. `rob.message.received`
3. `rob.ai.invoked`
4. `rob.message.sent`

### Test 4: Verify State Transitions

```bash
npm run supabase:query "
  SELECT from_state, to_state, reason 
  FROM rob_state_transitions 
  WHERE session_id = 'YOUR_SESSION_ID_HERE' 
  ORDER BY created_at;
"
```

**Expected:**
- INIT → WAITING (session initialized)
- WAITING → LISTENING (message received)

### Test 5: Check Engine Coordination

```bash
# Verify Rob uses other engines
grep -r "charterEngine\|silentEngine\|identityEngine" packages/engines/execution-engine/core/src/RobEngine.ts
```

**Expected output:**
- References to `this.charterEngine` (consent checks)
- References to `this.silentEngine` (AI routing)
- References to `this.identityEngine` (user context)

## Verification Checklist

- [ ] **Database:** All 9 Rob tables exist with correct schema
- [ ] **Registry:** Rob is in engine registry with 10 receipt types
- [ ] **Orchestrator:** RobEngine instantiated in EngineOrchestrator
- [ ] **UI - Home:** Rob card appears on homepage
- [ ] **UI - Engines:** Rob appears in engine list
- [ ] **UI - Detail:** /engines/rob page loads with metadata
- [ ] **API - Init:** /api/rob/init creates session
- [ ] **API - Message:** /api/rob/message processes messages
- [ ] **AI Integration:** OpenAI calls work, tokens tracked
- [ ] **Receipts:** All operations create receipts
- [ ] **State Machine:** State transitions logged correctly
- [ ] **Engine Coordination:** Rob coordinates with Charter/Silent/Identity engines

## Common Issues & Solutions

### Issue: "API key not found"
**Solution:** Check `.env.local` has `OPENAI_API_KEY=sk-...`

### Issue: "Database connection failed"
**Solution:** 
```bash
# Check Supabase credentials
grep NEXT_PUBLIC_SUPABASE .env.local
# Verify connection
npm run supabase:verify
```

### Issue: "Session not found"
**Solution:** Check RLS policies allow your user to access sessions

### Issue: "No AI response"
**Solution:**
1. Check OpenAI API key is valid
2. Check SilentEngine is routing to OpenAI
3. Check rob_ai_usage table for errors

## Success Criteria

✅ **Rob is working correctly if:**
1. You can create a session via API
2. You can send messages and get AI responses
3. All receipts are created in database
4. State transitions are logged
5. AI usage is tracked
6. UI pages load without errors
7. Engine coordination is verified (receipts show cross-engine calls)

## Next Steps

Once verification passes:
1. **Test with Rasheed:** Have him create a session and build an app
2. **Monitor usage:** Check rob_ai_usage for token consumption
3. **Verify billing:** Ensure usage limits are enforced
4. **Test consent:** CharterEngine should block actions without consent
5. **Test undo:** Verify undo stack works pre-publish
6. **Test GitHub:** Create a repo via /api/github/create-repo

## Quick Verification Script

```bash
#!/bin/bash
# Run all verification checks

echo "🔍 Verifying Rob the QuietBuilder..."

echo "1. Checking database tables..."
npm run supabase:verify

echo "2. Checking engine registry..."
grep -q '"rob"' packages/runtime/context.ts && echo "✅ Rob in registry" || echo "❌ Rob missing"

echo "3. Checking orchestrator..."
grep -q "RobEngine" packages/engines/execution-engine/core/src/EngineOrchestrator.ts && echo "✅ Rob in orchestrator" || echo "❌ Rob missing"

echo "4. Starting dev server..."
cd apps/proof-harness && npm run dev &
DEV_PID=$!
sleep 5

echo "5. Testing API endpoints..."
curl -s http://localhost:3000/api/rob/init | grep -q "success" && echo "✅ Init endpoint works" || echo "❌ Init failed"

kill $DEV_PID

echo "✅ Verification complete!"
```
