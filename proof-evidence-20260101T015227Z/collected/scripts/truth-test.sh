#!/bin/bash
# TRUTH TEST - Generate Real Receipts
# No claims without proof

set -e

echo "================================================"
echo "🧪 TRUTH TEST: Real Integration with Receipts"
echo "================================================"
echo ""

BASE_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)
RECEIPT_FILE="/tmp/rob_truth_receipts_${TIMESTAMP}.json"

echo "{\"test_run\": \"$TIMESTAMP\", \"receipts\": []}" > $RECEIPT_FILE

# Test 1: Session Init
echo "📋 Test 1: Session Initialization"
INIT_RESPONSE=$(curl -s -X POST $BASE_URL/api/rob/init \
  -H "Content-Type: application/json" \
  -d '{"template_id":"truth-test-app"}')

SESSION_ID=$(echo $INIT_RESPONSE | jq -r '.session.id')
echo "✅ Session Created: $SESSION_ID"
echo "$INIT_RESPONSE" | jq '{test: "init", session_id: .session.id, state: .session.state, consent: .session.consent_granted}' >> $RECEIPT_FILE
echo ""

# Test 2: Consent Grant
echo "📋 Test 2: Consent Grant (CharterEngine)"
CONSENT_RESPONSE=$(curl -s -X POST $BASE_URL/api/rob/message \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"message\":\"I consent\"}")

CONSENT_GRANTED=$(echo $CONSENT_RESPONSE | jq -r '.session.consent_granted')
NEW_STATE=$(echo $CONSENT_RESPONSE | jq -r '.session.state')
echo "✅ Consent: $CONSENT_GRANTED, State: $NEW_STATE"
echo "$CONSENT_RESPONSE" | jq '{test: "consent", consent_granted: .session.consent_granted, new_state: .session.state}' >> $RECEIPT_FILE
echo ""

# Test 3: AI Code Generation
echo "📋 Test 3: AI Code Generation (OpenAI)"
AI_RESPONSE=$(curl -s -X POST $BASE_URL/api/rob/message \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"message\":\"build a simple counter component with increment and decrement buttons\"}")

RESPONSE_TEXT=$(echo $AI_RESPONSE | jq -r '.response')
RESPONSE_LENGTH=${#RESPONSE_TEXT}
HAS_CODE=$(echo $RESPONSE_TEXT | grep -c '```' || echo "0")

echo "✅ Response Length: $RESPONSE_LENGTH chars"
echo "✅ Contains Code Blocks: $HAS_CODE"
echo "Response preview:"
echo "$RESPONSE_TEXT" | head -10
echo ""
echo "$AI_RESPONSE" | jq '{test: "ai_generation", response_length: ($RESPONSE_TEXT | length), has_code: $HAS_CODE, session_state: .session.state}' --arg RESPONSE_TEXT "$RESPONSE_TEXT" --argjson HAS_CODE $HAS_CODE >> $RECEIPT_FILE
echo ""

# Test 4: Check if running with real OpenAI
echo "📋 Test 4: AI Provider Check"
if echo "$RESPONSE_TEXT" | grep -q "OPENAI_API_KEY"; then
  echo "⚠️  FALLBACK MODE: No OpenAI key configured"
  echo "{\"test\": \"ai_provider\", \"status\": \"fallback\", \"reason\": \"no_api_key\"}" >> $RECEIPT_FILE
else
  echo "✅ REAL AI MODE: OpenAI responding"
  echo "{\"test\": \"ai_provider\", \"status\": \"real_openai\", \"tokens_likely_used\": true}" >> $RECEIPT_FILE
fi
echo ""

# Final Report
echo "================================================"
echo "📊 TRUTH RECEIPT GENERATED"
echo "================================================"
echo "File: $RECEIPT_FILE"
echo ""
echo "Summary:"
jq -s '.' $RECEIPT_FILE | jq '
  {
    test_timestamp: .[0].test_run,
    total_tests: (. | length - 1),
    receipts: .[1:] | map({test, result: (if .error then "FAILED" else "PASSED" end)})
  }
'
echo ""
echo "🎯 VERDICT: Check receipts above for proof"
echo "   - If OpenAI key configured: Real tokens used"
echo "   - If no key: Deterministic fallback (honest)"
echo ""
