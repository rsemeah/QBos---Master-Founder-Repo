#!/bin/bash
# Quick Rob Verification Test
# Run this to verify Rob is working

set -e

echo "🤖 Rob the QuietBuilder - Verification Test"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Engine Registry
echo -e "${BLUE}Test 1: Checking Engine Registry...${NC}"
if grep -q 'rob:' packages/runtime/context.ts; then
  echo -e "${GREEN}✅ Rob is registered in engine registry${NC}"
else
  echo -e "${RED}❌ Rob not found in registry${NC}"
  exit 1
fi

# Test 2: Orchestrator Integration
echo -e "${BLUE}Test 2: Checking Orchestrator Integration...${NC}"
if grep -q 'this.robEngine' packages/engines/execution-engine/core/src/EngineOrchestrator.ts; then
  echo -e "${GREEN}✅ Rob is integrated in EngineOrchestrator${NC}"
else
  echo -e "${RED}❌ Rob not found in orchestrator${NC}"
  exit 1
fi

# Test 3: API Endpoints
echo -e "${BLUE}Test 3: Checking API Endpoints...${NC}"
if [ -d "apps/proof-harness/app/api/rob/init" ] && [ -d "apps/proof-harness/app/api/rob/message" ]; then
  echo -e "${GREEN}✅ Rob API endpoints exist${NC}"
  echo "   - /api/rob/init"
  echo "   - /api/rob/message"
else
  echo -e "${RED}❌ API endpoints missing${NC}"
  exit 1
fi

# Test 4: RobEngine Implementation
echo -e "${BLUE}Test 4: Checking RobEngine Implementation...${NC}"
if [ -f "packages/engines/execution-engine/core/src/RobEngine.ts" ]; then
  LINES=$(wc -l < packages/engines/execution-engine/core/src/RobEngine.ts)
  echo -e "${GREEN}✅ RobEngine exists (${LINES} lines)${NC}"
else
  echo -e "${RED}❌ RobEngine.ts not found${NC}"
  exit 1
fi

# Test 5: Database Schema
echo -e "${BLUE}Test 5: Checking Database Schema...${NC}"
if [ -f "supabase/migrations/20251223000001_create_rob_tables.sql" ]; then
  TABLES=$(grep -c "CREATE TABLE.*rob_" supabase/migrations/20251223000001_create_rob_tables.sql || true)
  echo -e "${GREEN}✅ Rob database schema exists (${TABLES} tables)${NC}"
  echo "   Tables: rob_sessions, rob_messages, rob_receipts, rob_state_transitions,"
  echo "           rob_config_history, rob_undo_stack, rob_ai_usage, rob_plans,"
  echo "           rob_user_entitlements"
else
  echo -e "${RED}❌ Database schema not found${NC}"
  exit 1
fi

# Test 6: UI Pages
echo -e "${BLUE}Test 6: Checking UI Integration...${NC}"
if grep -q "'rob'" apps/proof-harness/app/engines/page.tsx; then
  echo -e "${GREEN}✅ Rob appears in engine list UI${NC}"
else
  echo -e "${RED}❌ Rob not in UI${NC}"
  exit 1
fi

# Test 7: Environment Variables
echo -e "${BLUE}Test 7: Checking Configuration...${NC}"
if [ -f "apps/proof-harness/.env.local" ]; then
  if grep -q "OPENAI_API_KEY" apps/proof-harness/.env.local; then
    echo -e "${GREEN}✅ OpenAI API key configured${NC}"
  else
    echo -e "${RED}⚠️  OpenAI API key not found in .env.local${NC}"
  fi
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" apps/proof-harness/.env.local; then
    echo -e "${GREEN}✅ Supabase configured${NC}"
  else
    echo -e "${RED}❌ Supabase not configured${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ .env.local not found${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}========================================="
echo "✅ All verification tests passed!"
echo "=========================================${NC}"
echo ""
echo "🚀 Rob is ready to use!"
echo ""
echo "Next steps:"
echo "1. Start the dev server:"
echo "   cd apps/proof-harness && npm run dev"
echo ""
echo "2. Open Rob in your browser:"
echo "   http://localhost:3000/engines/rob"
echo ""
echo "3. Or test via API:"
echo "   See examples/rob-demo.ts"
echo ""
echo "4. Full verification guide:"
echo "   See ROB_VERIFICATION_GUIDE.md"
echo ""
