# QBos Proof Gates - API Verification

This document provides curl commands and expected outputs for verifying the QBos proof harness API endpoints.

## Prerequisites

1. **Start the development server:**
   ```bash
   cd apps/proof-harness
   pnpm dev
   ```

2. **Server should be running on:**
   ```
   http://localhost:3000
   ```

3. **Optional: Set environment variables** (copy `.env.example` to `.env` and configure)

---

## 1. GET /api/health

**Purpose**: Health check and system information verification

### Local Command:
```bash
curl http://localhost:3000/api/health
```

### Expected Response:
```json
{
  "ok": true,
  "qbosVersion": "1.0.0",
  "commitSha": "abc1234",
  "timestamp": "2025-12-21T10:30:00.000Z",
  "runtime": {
    "engineRegistryLoadable": true,
    "nodeVersion": "v20.10.0",
    "platform": "linux"
  }
}
```

### Validation:
- ✅ `ok` should be `true`
- ✅ `qbosVersion` should match version in env or package.json
- ✅ `commitSha` should be present if in git repo
- ✅ `timestamp` should be valid ISO 8601 format
- ✅ `runtime.engineRegistryLoadable` should be `true`

---

## 2. POST /api/sight/track

**Purpose**: Track SightEngine events (non-blocking analytics)

### Local Command:
```bash
curl -X POST http://localhost:3000/api/sight/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user_action",
    "eventName": "button_clicked",
    "userId": "user_123",
    "sessionId": "session_456",
    "properties": {
      "buttonId": "submit",
      "page": "/dashboard"
    }
  }'
```

### Expected Response:
```json
{
  "ok": true,
  "tracked": true,
  "eventId": "evt_1703160000000_abc123",
  "timestamp": "2025-12-21T10:30:00.000Z"
}
```

### Response When Tracking Disabled:
```json
{
  "ok": true,
  "tracked": false,
  "warning": "SightEngine tracking is disabled",
  "eventId": "evt_1703160000000_abc123",
  "timestamp": "2025-12-21T10:30:00.000Z"
}
```

### Validation:
- ✅ `ok` should be `true` (even if tracking disabled)
- ✅ `tracked` indicates whether event was actually tracked
- ✅ `eventId` should be a unique identifier
- ✅ Request should succeed even if DB not configured (non-blocking)

### Error Cases:
```bash
# Missing required fields
curl -X POST http://localhost:3000/api/sight/track \
  -H "Content-Type: application/json" \
  -d '{
    "properties": { "test": "value" }
  }'
```

Expected error response:
```json
{
  "ok": false,
  "error": "eventType and eventName are required"
}
```

---

## 3. POST /api/charter/consent/accept

**Purpose**: Accept user consent (stubbed - CharterEngine not yet implemented)

### Local Command:
```bash
curl -X POST http://localhost:3000/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "documentType": "terms_of_service",
    "version": "1.0"
  }'
```

### Expected Response:
```json
{
  "ok": true,
  "stubbed": true,
  "consent_id": "consent_1703160000000_abc123",
  "userId": "user_123",
  "documentType": "terms_of_service",
  "version": "1.0",
  "acceptedAt": "2025-12-21T10:30:00.000Z",
  "message": "CharterEngine not yet implemented - consent stored in stub format"
}
```

### Validation:
- ✅ `ok` should be `true`
- ✅ `stubbed` should be `true` (indicating CharterEngine not implemented)
- ✅ `consent_id` should be a unique identifier
- ✅ `acceptedAt` should be valid ISO 8601 timestamp
- ⚠️ When CharterEngine is implemented, `stubbed` will be removed and actual consent record will be stored

### Error Cases:
```bash
# Missing required fields
curl -X POST http://localhost:3000/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123"
  }'
```

Expected error response:
```json
{
  "ok": false,
  "error": "userId, documentType, and version are required"
}
```

---

## 4. POST /api/ai/invoke

**Purpose**: Invoke AI with safety checks and engine routing

### Local Command (Basic):
```bash
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "userId": "user_123"
  }'
```

### Expected Response:
```json
{
  "ok": true,
  "provider": "anthropic",
  "model": "claude-3-haiku",
  "latencyMs": 125,
  "cost": 0.001,
  "output": "[Simulated anthropic response to: 'Explain quantum computing in simple terms...']",
  "safetyChecks": {
    "input": true,
    "output": true
  }
}
```

### Advanced Command (With Mode):
```bash
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a Python function to calculate factorial",
    "userId": "user_123",
    "orgId": "org_456",
    "mode": "code_generation"
  }'
```

### Validation:
- ✅ `ok` should be `true`
- ✅ `provider` should be one of: `anthropic`, `openai`, `google`
- ✅ `model` should match provider's model
- ✅ `latencyMs` should be present and > 0
- ✅ `cost` should be present
- ✅ `output` should contain AI response (simulated in proof harness)
- ✅ `safetyChecks.input` and `safetyChecks.output` should both be `true`

### Error Cases:

#### Missing Prompt:
```bash
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123"
  }'
```

Expected error response:
```json
{
  "ok": false,
  "error": "prompt is required"
}
```

#### Consent Required (when CONSENT_REQUIRED=true):
```bash
# Set CONSENT_REQUIRED=true in .env first
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt"
  }'
```

Expected error response:
```json
{
  "ok": false,
  "errorType": "consent_required",
  "error": "userId is required when CONSENT_REQUIRED=true"
}
```

#### Safety Violation (Input):
```bash
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate content promoting violence and hate",
    "userId": "user_123"
  }'
```

Expected error response:
```json
{
  "ok": false,
  "errorType": "safety_violation",
  "error": "Content violates safety policies",
  "violations": ["Matched pattern: /\\bhate\\b/i", "Matched pattern: /\\bviolence\\b/i"],
  "latencyMs": 5
}
```

#### No API Keys Configured:
```bash
# If no ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY is set
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "userId": "user_123"
  }'
```

Expected error response:
```json
{
  "ok": false,
  "error": "No AI provider API keys configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY"
}
```

---

## Environment Variables for Testing

Create `apps/proof-harness/.env` with:

```bash
# Environment
NODE_ENV=development
QBOS_ENV=dev

# Consent (set to true to test consent_required error)
CONSENT_REQUIRED=false

# SightEngine (set to false to test tracking disabled)
SIGHTENGINE_TRACKING_ENABLED=true

# At least one AI provider key required for /api/ai/invoke
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
# OR
GOOGLE_API_KEY=your-google-key

# QBos Version
NEXT_PUBLIC_QBOS_VERSION=1.0.0
```

---

## Production Testing

For production deployment, replace `http://localhost:3000` with your production URL:

```bash
PROD_URL="https://your-qbos-instance.com"

# Health Check
curl $PROD_URL/api/health

# SightEngine Tracking
curl -X POST $PROD_URL/api/sight/track \
  -H "Content-Type: application/json" \
  -d '{"eventType":"user_action","eventName":"test","userId":"user_123"}'

# Charter Consent
curl -X POST $PROD_URL/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","documentType":"terms","version":"1.0"}'

# AI Invoke
curl -X POST $PROD_URL/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test prompt","userId":"user_123"}'
```

---

## CI/CD Validation

These endpoints can be used in CI/CD pipelines:

```bash
#!/bin/bash
# validate-endpoints.sh

BASE_URL=${1:-"http://localhost:3000"}

echo "Testing QBos Proof Gates at $BASE_URL"

# 1. Health Check
echo "1. Testing /api/health..."
HEALTH=$(curl -s $BASE_URL/api/health)
echo $HEALTH | jq .
if [ $(echo $HEALTH | jq -r .ok) != "true" ]; then
  echo "❌ Health check failed"
  exit 1
fi
echo "✅ Health check passed"

# 2. SightEngine Track
echo "2. Testing /api/sight/track..."
TRACK=$(curl -s -X POST $BASE_URL/api/sight/track \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test","eventName":"ci_test"}')
echo $TRACK | jq .
if [ $(echo $TRACK | jq -r .ok) != "true" ]; then
  echo "❌ SightEngine track failed"
  exit 1
fi
echo "✅ SightEngine track passed"

# 3. Charter Consent
echo "3. Testing /api/charter/consent/accept..."
CONSENT=$(curl -s -X POST $BASE_URL/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{"userId":"ci_test","documentType":"terms","version":"1.0"}')
echo $CONSENT | jq .
if [ $(echo $CONSENT | jq -r .ok) != "true" ]; then
  echo "❌ Charter consent failed"
  exit 1
fi
echo "✅ Charter consent passed"

# 4. AI Invoke (requires API key)
if [ -n "$ANTHROPIC_API_KEY" ] || [ -n "$OPENAI_API_KEY" ]; then
  echo "4. Testing /api/ai/invoke..."
  AI=$(curl -s -X POST $BASE_URL/api/ai/invoke \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Test","userId":"ci_test"}')
  echo $AI | jq .
  if [ $(echo $AI | jq -r .ok) != "true" ]; then
    echo "❌ AI invoke failed"
    exit 1
  fi
  echo "✅ AI invoke passed"
else
  echo "⚠️  Skipping AI invoke (no API keys configured)"
fi

echo "✅ All proof gates passed!"
```

---

## Summary

All 4 proof gate endpoints are designed to:

1. **Degrade gracefully** when dependencies are missing
2. **Return clear error types** for debugging
3. **Be non-blocking** where appropriate (SightEngine tracking)
4. **Stub missing engines** (CharterEngine) with clear messaging
5. **Work in both dev and production** environments

For issues or questions, see `apps/proof-harness/README.md` or check the implementation in `apps/proof-harness/app/api/`.
