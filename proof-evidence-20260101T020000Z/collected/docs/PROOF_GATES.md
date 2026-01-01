# QBos V3 - Proof Gates

This document contains **curl commands** to validate all 8 engines are working.

Run these against your deployed proof harness or local dev server.

---

## Setup

```bash
# Start local server
cd apps/proof-harness
npm run dev

# Server should be running on http://localhost:3000
```

Replace `http://localhost:3000` with your Vercel URL for production testing.

---

## Gate 1: Health Check

```bash
curl -X GET http://localhost:3000/api/health \
  -H "Content-Type: application/json"
```

**Expected:** `{"status": "NOT_IMPLEMENTED", ...}`

---

## Gate 2: ExecutionEngine - Create Build Session

```bash
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createBuildSession",
    "appName": "MyFirstApp",
    "goals": ["auth", "ai"]
  }'
```

**Expected:** Session ID returned with steps

---

## Gate 3: CharterEngine - Accept Consent

```bash
curl -X POST http://localhost:3000/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "purpose": "ai",
    "metadata": {
      "ipAddress": "127.0.0.1"
    }
  }'
```

**Expected:** Consent record with `grantedAt` timestamp

---

## Gate 4: IdentityEngine - Create Session

```bash
curl -X POST http://localhost:3000/api/identity/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@example.com",
    "password": "not_real_yet"
  }'
```

**Expected:** Session token (24h expiry)

---

## Gate 5: ConfigEngine - Evaluate Feature Flag

```bash
curl -X POST http://localhost:3000/api/config/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "flagKey": "new_dashboard",
    "context": {
      "userId": "user_123"
    }
  }'
```

**Expected:** `{"enabled": true/false, "reason": "..."}`

---

## Gate 6: PaywallEngine - Check Entitlements

```bash
curl -X GET http://localhost:3000/api/paywall/entitlements?userId=user_123 \
  -H "Content-Type: application/json"
```

**Expected:** List of features user can access

---

## Gate 7: NotificationsEngine - Enqueue Notification

```bash
curl -X POST http://localhost:3000/api/notifications/enqueue \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "channel": "email",
    "subject": "Welcome to QBos",
    "body": "Your build is ready!"
  }'
```

**Expected:** Notification ID and status `queued` or `sending`

---

## Gate 8: SightEngine - Track Visual Event

```bash
curl -X POST http://localhost:3000/api/sight/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "componentId": "signup_button",
    "event": "click",
    "visualContext": {
      "viewport": "1920x1080",
      "colorScheme": "dark"
    }
  }'
```

**Expected:** Event ID and validation result

---

## Integration Test: Full Build Flow

Test all engines working together:

```bash
#!/bin/bash
BASE_URL="http://localhost:3000"

echo "=== QBos V3 Integration Test ==="

# 1. Create user session
echo "\n1. Creating user session..."
SESSION=$(curl -s -X POST $BASE_URL/api/identity/session/create \
  -H "Content-Type: application/json" \
  -d '{"email": "founder@qbos.dev", "password": "demo"}')
echo $SESSION

# 2. Accept AI consent
echo "\n2. Accepting AI consent..."
CONSENT=$(curl -s -X POST $BASE_URL/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_123", "purpose": "ai"}')
echo $CONSENT

# 3. Check paywall entitlements
echo "\n3. Checking entitlements..."
ENTITLEMENTS=$(curl -s -X GET "$BASE_URL/api/paywall/entitlements?userId=user_123")
echo $ENTITLEMENTS

# 4. Create build session
echo "\n4. Creating build session..."
BUILD=$(curl -s -X POST $BASE_URL/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{"action": "createBuildSession", "appName": "TestApp", "goals": ["auth", "ai"]}')
echo $BUILD

# 5. Send welcome notification
echo "\n5. Sending notification..."
NOTIF=$(curl -s -X POST $BASE_URL/api/notifications/enqueue \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_123", "channel": "email", "body": "Build started!"}')
echo $NOTIF

echo "\n=== Test Complete ==="
```

Save as `test-integration.sh`, make executable, and run:

```bash
chmod +x test-integration.sh
./test-integration.sh
```

---

## What You Should See

✅ **Success indicators:**
- All endpoints return JSON (not HTML errors)
- Status codes are 200 or 201
- Response bodies contain engine-specific data
- No connection refused errors

❌ **Failure indicators:**
- 404 Not Found (route missing)
- 500 Internal Server Error (implementation bug)
- Connection refused (server not running)
- CORS errors (misconfigured headers)

---

## Next: Connect Real Engines

Currently, proof-harness routes return `NOT_IMPLEMENTED`.  

To make these real:

1. Import engines into route files
2. Replace placeholder with actual engine calls
3. Add error handling
4. Return engine results

Example for [identity/session/create/route.ts](../apps/proof-harness/app/api/identity/session/create/route.ts):

```typescript
import { IdentityEngine } from '@qbos/identity-engine-core';

const engine = new IdentityEngine();

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // Real implementation
  const user = await engine.createUser({ email });
  const session = await engine.createSession(user.id);
  
  return Response.json({
    session: {
      token: session.token,
      userId: session.userId,
      expiresAt: session.expiresAt
    }
  });
}
```

Repeat for all 8 routes to complete integration.
