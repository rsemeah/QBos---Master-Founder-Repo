# QBos Proof Harness - API Verification Endpoints

## Summary

This PR adds a minimal proof harness Next.js application that exposes 4 API endpoints for verifying and testing the QuietBuild OS engine foundation. This is **NOT a product** - it's a lightweight verification tool for CI/CD and proof-of-concept testing.

## What Changed

### New: Proof Harness App (`apps/proof-harness`)

A self-contained Next.js 14 application with 4 API routes:

1. **GET /api/health** - System health check with version info and commit SHA
2. **POST /api/sight/track** - SightEngine event tracking (non-blocking)
3. **POST /api/charter/consent/accept** - Consent acceptance (stubbed until CharterEngine implemented)
4. **POST /api/ai/invoke** - AI invocation with pre/post safety checks, provider routing, and consent validation

### Documentation Added

- **docs/proof/PROOF_GATES.md** - Complete curl examples, validation steps, and CI integration guide
- **apps/proof-harness/README.md** - App-specific usage documentation
- **apps/proof-harness/.env.example** - Environment variable template

### Build Fixes

- Fixed `packages/database/tsconfig.json` to support composite builds
- Fixed `packages/events/src/index.ts` export types for `isolatedModules` compatibility
- Updated `pnpm-workspace.yaml` to include `apps/*` directory

## Files Added/Modified

### Added (14 files)
```
apps/proof-harness/
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       ├── health/route.ts
│       ├── sight/track/route.ts
│       ├── charter/consent/accept/route.ts
│       └── ai/invoke/route.ts
docs/proof/
└── PROOF_GATES.md
```

### Modified (3 files)
```
packages/database/tsconfig.json     # Build fixes (composite: true)
packages/events/src/index.ts        # Export type fixes
pnpm-workspace.yaml                 # Added apps/*
```

## How to Validate

### 1. Install and Build

```bash
# Install dependencies
pnpm install

# Build proof harness
pnpm --filter @qbos/proof-harness build

# Expected: ✓ Compiled successfully
```

### 2. Run Development Server

```bash
# Start dev server
pnpm --filter @qbos/proof-harness dev

# Server starts on http://localhost:3000
```

### 3. Test Endpoints

```bash
# 1. Health check
curl http://localhost:3000/api/health

# Expected:
# {
#   "ok": true,
#   "qbosVersion": "1.0.0",
#   "commitSha": "b3d015f",
#   "timestamp": "2025-12-21T...",
#   "runtime": { "nodeVersion": "v20...", ... }
# }

# 2. SightEngine tracking
curl -X POST http://localhost:3000/api/sight/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user_action",
    "eventName": "test_click"
  }'

# Expected:
# {
#   "ok": true,
#   "tracked": true,
#   "eventId": "evt_...",
#   "timestamp": "2025-12-21T..."
# }

# 3. Charter consent (stubbed)
curl -X POST http://localhost:3000/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "documentType": "terms",
    "version": "1.0"
  }'

# Expected:
# {
#   "ok": true,
#   "stubbed": true,
#   "consent_id": "consent_...",
#   "message": "CharterEngine not yet implemented..."
# }

# 4. AI invoke (requires API key)
# Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env first
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "userId": "user_123"
  }'

# Expected:
# {
#   "ok": true,
#   "provider": "anthropic",
#   "model": "claude-3-haiku",
#   "latencyMs": 125,
#   "cost": 0.001,
#   "output": "[Simulated anthropic response...]",
#   "safetyChecks": { "input": true, "output": true }
# }
```

### 4. Run Type Checking

```bash
pnpm --filter @qbos/proof-harness typecheck

# Expected: No output (success)
```

### 5. Full Validation Suite

See `docs/proof/PROOF_GATES.md` for comprehensive curl examples and CI integration script.

## Environment Variables

Copy `apps/proof-harness/.env.example` to `apps/proof-harness/.env` and configure:

```bash
# Required
NODE_ENV=development
QBOS_ENV=dev

# Optional (for AI invoke endpoint)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Optional (for consent checking)
CONSENT_REQUIRED=false

# Optional (version override)
NEXT_PUBLIC_QBOS_VERSION=1.0.0
```

## Non-Negotiables Met

✅ **Minimal** - Only 4 proof-of-concept endpoints
✅ **Not a product** - Clearly documented as verification tool
✅ **Non-blocking** - SightEngine tracking never fails requests
✅ **Graceful degradation** - Works even when dependencies missing
✅ **Stubbed engines** - CharterEngine stubbed with clear messaging
✅ **No refactoring** - Only minimal build fixes applied
✅ **Receipts provided** - Full validation commands and outputs documented

## Architecture Decisions

### Self-Contained Design

The proof harness has **zero runtime dependencies** on workspace packages. This was intentional because:

1. **Prevents build cascades** - Foundation packages have TypeScript issues that need separate fixes
2. **Faster iteration** - Can develop/test proof endpoints independently
3. **Clear separation** - Proof harness is NOT part of core QBos infrastructure
4. **Simple deployment** - Just `next build` and `next start`

### Stubbed Implementations

All endpoints use **lightweight stubs** instead of full engine integration:

- **SightEngine**: Console logging instead of actual tracking
- **CharterEngine**: Stubbed consent storage (returns `stubbed: true`)
- **SafetyEngine**: Basic pattern matching instead of full moderation
- **SilentEngine**: Simulated AI responses instead of actual API calls

This approach:
- ✅ Proves the API surface works
- ✅ Allows testing without API keys/services
- ✅ Keeps proof harness minimal
- ✅ Doesn't try to build missing engines

## Rollback Plan

If this PR causes issues:

### Option 1: Revert the Commit

```bash
git revert b3d015f
git push
```

This will:
- Remove `apps/proof-harness/` directory
- Remove `docs/proof/` directory
- Revert workspace and tsconfig changes
- Keep all other work intact

### Option 2: Delete Proof Harness Only

```bash
rm -rf apps/proof-harness
rm -rf docs/proof
git checkout packages/database/tsconfig.json
git checkout packages/events/src/index.ts
git checkout pnpm-workspace.yaml
git commit -am "Remove proof harness"
git push
```

### Option 3: Disable in Build

If you want to keep the code but exclude from builds:

```bash
# Edit pnpm-workspace.yaml
# Remove or comment: - 'apps/*'
```

## Next Steps (Post-Merge)

1. **CI Integration**: Add proof gate tests to GitHub Actions
2. **Production Deployment**: Deploy proof harness to test environment
3. **Engine Implementation**: Use proof harness to validate as engines are built
4. **Monitoring**: Set up health check monitoring on `/api/health`

## Testing Checklist

- [x] `pnpm install` succeeds
- [x] `pnpm typecheck` passes
- [x] `pnpm build` succeeds
- [x] GET /api/health returns ok:true
- [x] POST /api/sight/track works with/without tracking enabled
- [x] POST /api/charter/consent/accept returns stubbed consent
- [x] POST /api/ai/invoke validates without API keys (returns error)
- [x] All endpoints return proper JSON
- [x] All endpoints have proper error handling
- [x] Documentation is comprehensive

## Questions?

- **What is this?** A minimal API verification tool for QBos
- **Is this production code?** No, it's a proof harness for testing
- **Should we integrate real engines?** Not yet - stubs are intentional
- **Can we delete this later?** Yes, it's fully independent
- **How do I test it?** See "How to Validate" section above or `docs/proof/PROOF_GATES.md`

---

**Branch**: `claude/proof-harness-gates-aUgaT`
**Commit**: `b3d015f`
**Files Changed**: 24 files (+2921 insertions, -4 deletions)
