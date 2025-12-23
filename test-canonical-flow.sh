#!/usr/bin/env bash
# TruthSerum Canonical Flow Test
# This script exercises ALL engines in proper sequence and validates receipts

set -e

BASE_URL="${1:-http://localhost:3000}"

echo "════════════════════════════════════════════════════════"
echo "QBOS V3 - TRUTHSERUM CANONICAL FLOW TEST"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Step 1: Create session (IdentityEngine)
echo "✓ STEP 1: Creating session via IdentityEngine..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/identity/session/create" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@qbos.com"}')

echo "$SESSION_RESPONSE" | jq '.'

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.data.sessionId')
USER_ID=$(echo "$SESSION_RESPONSE" | jq -r '.data.userId')

if [ "$SESSION_ID" = "null" ] || [ "$USER_ID" = "null" ]; then
  echo "❌ Failed to create session"
  exit 1
fi

echo "   Session: $SESSION_ID"
echo "   User: $USER_ID"
echo ""

# Step 2: Accept consent (CharterEngine)
echo "✓ STEP 2: Granting consent via CharterEngine..."
CONSENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/charter/consent/accept" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"purpose\": \"ai_processing\"}")

echo "$CONSENT_RESPONSE" | jq '.'
echo ""

# Step 3: Enable AI feature flag (ConfigEngine)
echo "✓ STEP 3: Checking feature flag via ConfigEngine..."
CONFIG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/config/evaluate" \
  -H "Content-Type: application/json" \
  -d "{\"flagKey\": \"ai_enabled\", \"userId\": \"$USER_ID\"}")

echo "$CONFIG_RESPONSE" | jq '.'
echo ""

# Step 4: Check entitlements (PaywallEngine)
echo "✓ STEP 4: Checking entitlements via PaywallEngine..."
PAYWALL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/paywall/entitlements" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}")

echo "$PAYWALL_RESPONSE" | jq '.'
echo ""

# Step 5: Invoke AI with FULL orchestration
echo "✓ STEP 5: Invoking AI via FULL ORCHESTRATION..."
AI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/invoke" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"userId\": \"$USER_ID\",
    \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]
  }")

echo "$AI_RESPONSE" | jq '.'

# Extract TruthSerum validation
TRUTHSERUM_VALID=$(echo "$AI_RESPONSE" | jq -r '.truthSerum.valid')
ENGINES_INVOKED=$(echo "$AI_RESPONSE" | jq -r '.truthSerum.enginesInvoked | join(", ")')
GATES_CHECKED=$(echo "$AI_RESPONSE" | jq -r '.truthSerum.gatesChecked | join(", ")')
VIOLATIONS=$(echo "$AI_RESPONSE" | jq -r '.truthSerum.violations | length')

echo ""
echo "════════════════════════════════════════════════════════"
echo "TRUTHSERUM VALIDATION RESULTS"
echo "════════════════════════════════════════════════════════"
echo "Valid: $TRUTHSERUM_VALID"
echo "Engines Invoked: $ENGINES_INVOKED"
echo "Gates Checked: $GATES_CHECKED"
echo "Ordering Violations: $VIOLATIONS"
echo ""

# Step 6: Track visual quality (SightEngine)
echo "✓ STEP 6: Validating visual quality via SightEngine..."
SIGHT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/sight/track" \
  -H "Content-Type: application/json" \
  -d '{
    "assetType": "screenshot",
    "tier": "investor",
    "spec": {
      "width": 1920,
      "height": 1080,
      "format": "png"
    }
  }')

echo "$SIGHT_RESPONSE" | jq '.'
echo ""

# Step 7: Queue notification (NotificationsEngine)
echo "✓ STEP 7: Enqueuing notification via NotificationsEngine..."
NOTIF_RESPONSE=$(curl -s -X POST "$BASE_URL/api/notifications/enqueue" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"ai_complete\",
    \"to\": \"$USER_ID\",
    \"payload\": {\"sessionId\": \"$SESSION_ID\"}
  }")

echo "$NOTIF_RESPONSE" | jq '.'
echo ""

echo "════════════════════════════════════════════════════════"
echo "CANONICAL FLOW COMPLETE"
echo "════════════════════════════════════════════════════════"

if [ "$TRUTHSERUM_VALID" = "true" ]; then
  echo "✅ ALL ENGINES COORDINATED SUCCESSFULLY"
  echo "✅ TRUTHSERUM VALIDATION PASSED"
  exit 0
else
  echo "⚠️  TruthSerum validation issues detected"
  echo "   Check violations above for details"
  exit 1
fi
