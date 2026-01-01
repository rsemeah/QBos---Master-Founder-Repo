#!/bin/bash

# Canonical Flow - End-to-end proof test
# Tests: session create → chat → receipts → truth evaluation

set -e

OUTPUT_FILE="proof/03_canonical_flow.txt"

echo "🧪 Running Canonical Flow Test" | tee "$OUTPUT_FILE"
echo "================================" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Base URL: $BASE_URL" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# Step 1: Create session
echo "Step 1: Creating session..." | tee -a "$OUTPUT_FILE"
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/session" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","templateId":"saas","appName":"TestApp"}')

echo "$SESSION_RESPONSE" | tee -a "$OUTPUT_FILE"
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "Session ID: $SESSION_ID" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create session" | tee -a "$OUTPUT_FILE"
  exit 1
fi

# Step 2: Send chat message
echo "Step 2: Sending chat message..." | tee -a "$OUTPUT_FILE"
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Build me a SaaS app\",\"sessionId\":\"$SESSION_ID\",\"userId\":\"test-user\"}")

echo "$CHAT_RESPONSE" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# Step 3: Fetch receipts
echo "Step 3: Fetching receipts..." | tee -a "$OUTPUT_FILE"
RECEIPTS_RESPONSE=$(curl -s "$BASE_URL/api/receipts?sessionId=$SESSION_ID")
echo "$RECEIPTS_RESPONSE" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# Step 4: Evaluate truth
echo "Step 4: Evaluating truth..." | tee -a "$OUTPUT_FILE"
TRUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/truth/evaluate" \
  -H "Content-Type: application/json" \
  -d "{\"intentId\":\"session.ready\",\"sessionId\":\"$SESSION_ID\"}")

echo "$TRUTH_RESPONSE" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# Verify state
TRUTH_STATE=$(echo "$TRUTH_RESPONSE" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)
echo "Truth State: $TRUTH_STATE" | tee -a "$OUTPUT_FILE"

if [ "$TRUTH_STATE" = "Verified" ] || [ "$TRUTH_STATE" = "Unknown" ]; then
  echo "✅ Canonical flow completed successfully" | tee -a "$OUTPUT_FILE"
  exit 0
else
  echo "❌ Unexpected truth state: $TRUTH_STATE" | tee -a "$OUTPUT_FILE"
  exit 1
fi
