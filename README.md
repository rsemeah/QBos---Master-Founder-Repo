# QuietBuild OS™ V3 - Master Founder Repository

**Complete 8-Engine Platform + TruthSerum™ Verification System + Robby PA Autonomous Conductor**

QuietBuild OS™ V3 is a production-ready infrastructure platform that guides founders through building serious applications step-by-step. Every engine enforces world-class standards, from visual quality to AI routing to user authentication.

**TruthSerum™** ensures no claims without proof. Every operation generates receipts. Every state transition is auditable. No mock data passes as real.

Built for founders who need investor-grade demos with proof artifacts, not promises.

---

## ⚡ Latest Updates (January 2026)

### 🎉 Production Status
**Status:** FUNCTIONAL - Local development ready, 3 integrations needed for full production

**What's Running Now:**
- ✅ Complete Vite React UI (14 files) - port 3001
- ✅ Next.js Backend API (29 routes) - port 3000
- ✅ Constitutional state machine (13 states)
- ✅ CharterEngine consent enforcement
- ✅ Supabase migrations ready (14 migration files, ~3,000 lines SQL)
- ✅ OpenAI GPT-4 integration (requires API key)
- ✅ GitHub OAuth + repo creation (requires OAuth setup)
- ✅ Token tracking and cost logging
- ✅ Robby CLI tool with verification commands
- ✅ War Room Operations Control Plane (health, costs, drift, runbooks)
- ✅ 12 CI/CD workflows with TruthGate enforcement + nightly regression

**What's Configurable (Choose What You Need):**
- ⚡ **OpenAI API Key** → Real AI code generation
- ⚡ **GitHub OAuth** → Create repos with generated code
- ⚡ **Supabase Service Key** → Full database persistence
- ⚡ **Nothing** → Works with deterministic fallbacks and local receipts

**See:**
- [Production Certificate](docs/PRODUCTION_CERTIFICATE.md) - Honest production readiness assessment
- [Complete Setup Guide](docs/COMPLETE_SETUP_GUIDE.md) - Step-by-step for all options
- [Investor Truth Sheet](docs/INVESTOR_TRUTH_SHEET.md) - TruthSerum-verified status

### 🔒 TruthSerum™ & Constitutional Enforcement
**Status:** OPERATIONAL

Automated truth enforcement across the entire codebase:
- ✅ No unverified claims allowed
- ✅ CI TruthGate validates every push (5 validation scripts)
- ✅ Receipt system with parent-child chaining
- ✅ Keystore receipt verification with EdDSA signatures
- ✅ Route manifest alignment (29 routes across 8 engines)
- ✅ Engine page coverage (8/8 engines verified)
- ✅ Local-first: Works without Supabase, writes to `receipts/` directory
- ✅ Supabase integration: Seamless cloud persistence when connected

### 📚 Comprehensive Documentation
**40+ documentation files across multiple categories:**

**Setup & Deployment:**
- [Rob Vertical Slice Execution](docs/ROB_VERTICAL_SLICE_EXECUTION.md) - Complete deployment guide
- [Rob Production Deployment](docs/ROB_PRODUCTION_DEPLOYMENT.md) - 4-phase production checklist
- [Complete Setup Guide](docs/COMPLETE_SETUP_GUIDE.md) - Full integration steps
- [Supabase Setup Steps](SUPABASE_SETUP_STEPS.md) - Database deployment guide

**Truth & Verification:**
- [Constitutional Enforcement Audit](docs/CONSTITUTIONAL_ENFORCEMENT_AUDIT.md) - System compliance report
- [TruthSerum Verified Inventory](docs/TRUTHSERUM_VERIFIED_INVENTORY.md) - Verification inventory
- [Secrets & Auth Enforcement](docs/SECRETS_AND_AUTH_PROMPT.md) - Security rules
- [Investor Truth Sheet](docs/INVESTOR_TRUTH_SHEET.md) - TruthSerum-verified status

**Technical Documentation:**
- [Engine Status](docs/STATUS.md) - Complete implementation status
- [Proof Gates](docs/PROOF_GATES.md) - API test commands
- [Architecture Decision Records](docs/ADR/) - Design decisions
- [Auditor Handoff](docs/auditor-handoff/) - External auditor documentation

---

## 🧪 TruthSerum™ - Constitutional Proof System

**Location:** `packages/truthserum/`
**Size:** ~794 lines of TypeScript
**Status:** OPERATIONAL

**What It Does:**
- ✅ No claims accepted without receipts
- ✅ All state transitions auditable
- ✅ Every API response sanitized for unproven claims
- ✅ CI enforcement via TruthGate
- ✅ Investor truth sheet generated from actual receipts
- ✅ Keystore receipt verification with EdDSA signatures
- ✅ Local-first with Supabase fallback

**Implementation:**
```typescript
import { TruthSerum } from '@qbos/truthserum';
import { ReceiptWriter } from '@qbos/truthserum';

// Evaluate intent before proceeding
const evaluation = await TruthSerum.evaluateIntent('deploy.ready', context);
if (evaluation.truthState !== 'Verified') {
  return {
    error: 'Cannot proceed without proof',
    missing: evaluation.missingProofs
  };
}

// Write receipt after operation
await ReceiptWriter.write({
  sessionId: 'session-123',
  type: 'deploy.completed',
  details: {
    timestamp: new Date().toISOString(),
    url: 'https://app.vercel.com'
  }
});
```

**Key Components:**
- `TruthSerum.ts` - Intent evaluation engine
- `ReceiptWriter.ts` - Supabase + local fallback receipt writer
- `keystore.ts` - Receipt verification with signatures
- `intents/registry.ts` - Intent definitions
- `server.ts` - Standalone verification server

**Read more:** [packages/truthserum/README.md](packages/truthserum/README.md)

---

## 🏛️ War Room - Operations Control Plane

**Location:** `packages/war-room/`
**Size:** ~2,500 lines of TypeScript (Phase 1 + Phase 2)
**Status:** OPERATIONAL - Ready for production

**What It Does:**
- ✅ Real-time system health monitoring (constitutional, engines, Robby PA, costs)
- ✅ Automated regression testing with golden bundle comparison
- ✅ Cost controls with budget caps and routing overrides
- ✅ Robby PA autonomy management (levels 0-4, kill-switch)
- ✅ Emergency controls (system freeze, emergency stop)
- ✅ Change impact analysis (correlate commits with degradations)
- ✅ Drift detection (behavioral baseline monitoring)
- ✅ Automated remediation runbooks (4 built-in, auto-execute)
- ✅ Nightly regression GitHub Action
- ✅ Operator-only, receipt-backed, CLI-first

**Philosophy:**
- **Operator-Only:** Never exposed to end users
- **Read-First:** Observability before control
- **Receipt-Backed:** Every operation emits TruthSerum receipt
- **CLI-First:** Terminal-native experience
- **Local-First:** Works without Supabase (local receipt fallback)

**Implementation:**
```bash
# System status
war-room status              # Overall health dashboard
war-room health              # Detailed health check
war-room regress [profile]   # Run regression tests

# Robby PA management
war-room robby status
war-room robby downgrade 1 "High error rate"
war-room robby kill "Emergency"

# Cost management
war-room cost status
war-room cost set-cap 1000
war-room cost override gpt-3.5-turbo "Cost reduction"

# Emergency controls
war-room freeze freeze "Deployment in progress"
war-room freeze unfreeze
war-room freeze emergency "Critical security issue"

# Phase 2: Advanced features
war-room impact analyze <commit-sha>   # Analyze commit impact
war-room drift detect                  # Detect behavioral drift
war-room runbooks list                 # List automated runbooks
war-room runbooks check                # Check triggers & auto-execute
```

**Key Components:**
- `src/health/` - Constitutional, engine, Robby PA, cost health monitoring
- `src/regression/` - Golden bundle comparison and drift detection
- `src/cost/` - Budget caps, routing overrides, spend tracking
- `src/robby/` - Autonomy level management and scope enforcement
- `src/controls/` - System freeze, unfreeze, emergency stop
- `src/datasources/` - Live data integration (TruthSerum, engines)
- `src/impact/` - Change impact analysis and commit correlation
- `src/drift/` - Behavioral drift detection from baseline
- `src/runbooks/` - Automated remediation workflows
- `cli/` - War Room CLI with 9 commands
- `supabase/migrations/20260121000000_create_war_room_tables.sql` - Database schema

**Built-in Runbooks:**
1. **high-error-rate** (auto-execute): Respond to error spikes
2. **cost-emergency** (auto-execute): Emergency budget response at 95%
3. **health-degraded** (manual): Respond to system health degradation
4. **emergency-freeze** (manual): Immediate system freeze

**Nightly Regression:**
- Automated GitHub Action runs at 2 AM UTC daily
- Health check → Run all tests → Status report
- Auto-creates GitHub issues on failure
- Cost threshold monitoring
- Slack/email notification ready

**Database Schema:**
- `war_room_events` - Operational event stream
- `war_room_health_snapshots` - Periodic health checks
- `war_room_regression_results` - Regression test results
- `war_room_freeze_log` - Freeze/unfreeze audit trail
- `war_room_cost_caps` - Budget configurations
- `war_room_routing_overrides` - Model routing overrides
- `war_room_robby_autonomy_log` - Autonomy level changes

**Read more:**
- [packages/war-room/README.md](packages/war-room/README.md) - Complete documentation
- [packages/war-room/DEPLOYMENT.md](packages/war-room/DEPLOYMENT.md) - Deployment guide
- [.github/workflows/war-room-nightly.yml](.github/workflows/war-room-nightly.yml) - Nightly regression workflow

---

## 🎯 QBos V3 - Complete 8-Engine Suite

### **ExecutionEngine™** - Interactive Build Command Center
**Location:** `packages/engines/execution-engine/core/`
**Size:** ~2,950 lines of TypeScript
**Status:** COMPLETE - In-memory storage

The product. Everything else is infrastructure.

**What It Does:**
- ✅ Guides non-technical founders through building apps step-by-step
- ✅ Explains every action in child-readable language
- ✅ Never loses state, never lies, never silently fails
- ✅ Generates receipts proving what was built
- ✅ Gracefully degrades if engines are missing
- ✅ Idempotent step execution
- ✅ Semantic step IDs for clarity

**Implementation:**
```typescript
import { ExecutionEngine } from '@qbos/execution-engine-core';

const engine = new ExecutionEngine();
const sessionId = await engine.createBuildSession('MyApp', ['auth', 'ai']);

const nextStep = await engine.getNextStep(sessionId);
console.log(nextStep.data.explanation); // Child-readable

const result = await engine.executeStep(sessionId, nextStep.data.id);
const receipts = await engine.getReceipts(sessionId); // Audit bundle
```

**Key Components:**
- `ExecutionEngine.ts` - Main orchestration engine
- `BuildSession.ts` - Session management
- `StepRegistry.ts` - Step definitions with semantic IDs
- `StateStore.ts` - In-memory state storage
- `receipts/` - Receipt generation

---

### **IdentityEngine™** - Users, Organizations, Sessions, RBAC
**Location:** `packages/engines/identity-engine/core/`
**Size:** ~373 lines of TypeScript
**Status:** COMPLETE - Supabase-ready

**What It Does:**
- ✅ User management (create, authenticate, delete)
- ✅ Organization management with slugs
- ✅ Membership roles (owner, admin, member, viewer)
- ✅ Session tokens with 24h expiry
- ✅ Database migration with RLS policies

**Implementation:**
```typescript
import { IdentityEngine } from '@qbos/identity-engine-core';

const engine = new IdentityEngine();
const user = await engine.createUser({
  email: 'founder@qbos.dev',
  name: 'Founder'
});
const session = await engine.createSession(user.id);
console.log(session.token); // 24h session token
```

**Database Migration:** `supabase/migrations/20241226_identity_engine.sql`

---

### **CharterEngine™** - Consent Management & GDPR Compliance
**Location:** `packages/engines/charter-engine/core/`
**Size:** ~307 lines of TypeScript
**Status:** COMPLETE - Supabase-ready

**What It Does:**
- ✅ Track user consent by purpose (AI, analytics, marketing, essential)
- ✅ Consent expiry and withdrawal
- ✅ GDPR data rights (access, deletion, portability, rectification)
- ✅ IP address and user agent logging
- ✅ Integrated into Rob's state machine

**Implementation:**
```typescript
import { CharterEngine } from '@qbos/charter-engine-core';

const engine = new CharterEngine();
const consent = await engine.grantConsent('user_123', 'ai', {
  ipAddress: '127.0.0.1',
  expiresInDays: 365
});

const check = await engine.checkConsent('user_123', 'ai');
console.log(check.allowed); // true/false
```

**Database Migration:** `supabase/migrations/20241226_charter_engine.sql`

---

### **ConfigEngine™** - Feature Flags & Configuration
**Location:** `packages/engines/config-engine/core/`
**Size:** ~240 lines of TypeScript
**Status:** COMPLETE - In-memory storage

**What It Does:**
- ✅ Feature flags (enabled, disabled, conditional)
- ✅ Conditional targeting (user, org, percentage, date)
- ✅ Configuration values with scopes (global, user, org)
- ✅ Type-safe config inference

**Implementation:**
```typescript
import { ConfigEngine } from '@qbos/config-engine-core';

const engine = new ConfigEngine();
await engine.setFlag('new_dashboard', 'conditional', {
  conditions: [{
    type: 'user',
    operator: 'in',
    value: ['beta_user_1', 'beta_user_2']
  }]
});

const result = await engine.isEnabled('new_dashboard', {
  userId: 'beta_user_1'
});
console.log(result.enabled); // true
```

**Database Migration:** `supabase/migrations/20241226_config_engine.sql`

---

### **PaywallEngine™** - Pricing, Entitlements, Billing
**Location:** `packages/engines/paywall-engine/core/`
**Size:** ~270 lines of TypeScript
**Status:** COMPLETE - Structure ready, Stripe integration pending

**What It Does:**
- ✅ Pricing plans with limits (maxUsers, maxProjects, maxAIRequests)
- ✅ Subscription management with trials
- ✅ Entitlement checks
- ✅ Usage tracking and limit enforcement
- ⚠️ Live payment processing pending (Stripe webhook integration ready)

**Implementation:**
```typescript
import { PaywallEngine } from '@qbos/paywall-engine-core';

const engine = new PaywallEngine();
const sub = await engine.createSubscription('user_123', 'pro', {
  trialDays: 14
});

const check = await engine.checkEntitlement('user_123', 'priority_support');
console.log(check.allowed); // true if in plan
```

**Database Migration:** `supabase/migrations/20241226_paywall_engine.sql`
**Webhook Handler:** `apps/proof-harness/app/api/webhooks/stripe/route.ts`

---

### **NotificationsEngine™** - Email, SMS, Push Queue
**Location:** `packages/engines/notifications-engine/core/`
**Size:** ~230 lines of TypeScript
**Status:** COMPLETE - Structure ready, provider integration pending

**What It Does:**
- ✅ Send notifications with priority and scheduling
- ✅ Template system with variable substitution
- ✅ User preferences per channel (email, sms, push)
- ✅ Queue processing with retry logic
- ⚠️ Live email/SMS pending (SendGrid/Twilio integration ready)

**Implementation:**
```typescript
import { NotificationsEngine } from '@qbos/notifications-engine-core';

const engine = new NotificationsEngine();
const notif = await engine.send({
  userId: 'user_123',
  channel: 'email',
  subject: 'Welcome to QBos',
  body: 'Your build is ready!'
});

console.log(notif.status); // 'queued' | 'sending' | 'sent'
```

**Database Migration:** `supabase/migrations/20241226_notifications_engine.sql`

---

### **SightEngine™** - Visual Quality Standards
**Location:** `packages/sight-engine/`
**Size:** ~730 lines of TypeScript
**Status:** PRODUCTION READY

Enforces investor-grade visual quality across all brand assets.

**What It Does:**
- ✅ Validates visual assets against tier requirements (A: Investor-grade, B: Product-grade, C: Internal)
- ✅ Rejects AI-looking outputs, flat lighting, and low-quality visuals
- ✅ Generates AI prompts with embedded quality standards
- ✅ Enforces logo requirements (16px readable, 8K scalable)
- ✅ Quality scoring (0-100)
- ✅ AI artifact detection

**Implementation:**
```typescript
import { validateAsset, generatePromptHeader } from '@qbos/sight-engine';

const result = validateAsset(assetSpec, 'hero-image', 'A');
console.log(result.passed); // true/false
console.log(result.score);  // 0-100
console.log(result.issues); // Detailed feedback
```

**Database Migrations:**
- `supabase/migrations/20251220000001_create_sight_engine_tables.sql`

**Read more:** [packages/sight-engine/README.md](packages/sight-engine/README.md)

---

### **SilentEngine™** - Intelligent AI Routing
**Location:** `packages/silent-engine/core/`
**Size:** ~2,374 lines of TypeScript
**Status:** PRODUCTION READY

Routes AI requests to the best model based on capabilities, cost, latency, and availability.

**What It Does:**
- ✅ Capability-based routing (long_context, tool_use, vision, streaming, code_generation, strong_reasoning, low_cost, fast_latency)
- ✅ Circuit breaker with automatic fallback
- ✅ Safety checks (PII detection, jailbreak prevention)
- ✅ Complete observability (events, audit logs)
- ✅ Cost tracking and optimization
- ✅ 4 provider implementations (Anthropic, OpenAI, Google, Mock)

**Implementation:**
```typescript
import { SilentEngine } from '@qbos/silent-engine-core';
import { AnthropicProvider } from '@qbos/silent-engine-core/dist/providers/anthropic-provider';
import { OpenAIProvider } from '@qbos/silent-engine-core/dist/providers/openai-provider';

const silentEngine = new SilentEngine({
  providers: [
    new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY }),
    new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY })
  ],
  policies: [costOptimized, qualityFirst],
  defaultPolicyKey: 'cost_optimized'
});

const result = await silentEngine.generate({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  maxCost: 0.001,
  maxLatency: 3000,
  preferredCapabilities: ['low_cost', 'fast_latency']
});

console.log(result.response.text);
console.log('Cost:', result.actualCost);
console.log('Provider:', result.provider);
console.log('Model:', result.model);
```

**Database Migrations:**
- `supabase/migrations/20251220000002_create_silent_engine_tables.sql`
- `supabase/migrations/20251220000003_seed_silent_engine_data.sql`

**Read more:** [packages/silent-engine/core/README.md](packages/silent-engine/core/README.md)

---

## 🤖 Robby PA - Autonomous Build Conductor

**Location:** `packages/robby-pa/`
**Size:** ~672 lines of TypeScript
**Status:** FUNCTIONAL - Build + unit tests operational, integration pending

Autonomous build conductor that orchestrates ExecutionEngine with TruthSerum enforcement.

**What It Does:**
- ✅ API Layer with auth middleware, cost guard, rate limiting
- ✅ Autonomy Loop: Observe → Decide → Act
- ✅ State machine: INTENT → EXECUTION → VERDICT
- ✅ Integration with SilentEngine, ExecutionEngine, TruthSerum
- ⚠️ API/DB receipt integration in progress

**Key Components:**
- `src/orchestrator.ts` - Main orchestration logic
- `src/stateMachine.ts` - State machine implementation
- `src/engines/` - Engine integrations
- `src/phases/` - Build phases
- `src/store/` - State storage

**CLI Tool (Robby):**
```bash
robby calibrate   # Calibrate system
robby verify      # Verify build
robby certify     # Generate certificate
robby retro       # Run retrospective
robby rotate-key  # Rotate keystore key
```

**Docker Support:**
- `Dockerfile` - Production container
- `docker-compose.yml` - Local development
- Kubernetes manifests in `kubernetes/base/`

---

## 📦 Repository Structure

```
QBos V3 - Complete Platform/
├── apps/
│   ├── proof-harness/              # Next.js backend (29 API routes)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── chat/           # TruthSerum-guarded chat
│   │   │   │   ├── truth/evaluate/ # Intent evaluation
│   │   │   │   ├── receipts/       # Receipt read/write
│   │   │   │   ├── session/        # Session creation
│   │   │   │   ├── build/          # Build session management
│   │   │   │   ├── billing/status/ # Billing state from receipts
│   │   │   │   ├── github/create-repo/ # GitHub repo creation
│   │   │   │   ├── webhooks/stripe/ # Stripe webhook handler
│   │   │   │   └── [8 engine-specific routes]/
│   │   │   ├── rob/               # Rob the Builder page
│   │   │   ├── engines/           # Engine dashboard
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── build/             # Build interface
│   │   │   ├── demo/              # Demo page
│   │   │   ├── truthlog/          # Receipt viewer
│   │   │   └── whathappened/      # Audit log
│   │   └── package.json
│   │
│   ├── rob-ui/                    # Vite React frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── RobPage.tsx    # Main Rob interface
│   │   │   │   └── RobBuilder.tsx # Builder interface
│   │   │   └── components/        # React components
│   │   └── package.json
│   │
│   └── robby/                     # CLI tool
│       ├── src/
│       │   ├── cli.ts             # CLI entry point
│       │   ├── core/              # Core functionality
│       │   ├── workflows/         # Workflow implementations
│       │   └── util/              # Utilities
│       └── package.json
│
├── packages/
│   ├── truthserum/                # Constitutional proof system
│   │   ├── src/
│   │   │   ├── TruthSerum.ts      # Intent evaluation
│   │   │   ├── ReceiptWriter.ts   # Supabase + local fallback
│   │   │   ├── keystore.ts        # Receipt verification
│   │   │   ├── server.ts          # Standalone server
│   │   │   ├── types.ts           # Type definitions
│   │   │   └── intents/
│   │   │       └── registry.ts    # Intent definitions
│   │   └── README.md
│   │
│   ├── robby-pa/                  # Autonomous build conductor
│   │   ├── src/
│   │   │   ├── orchestrator.ts    # Main orchestration
│   │   │   ├── stateMachine.ts    # State machine
│   │   │   ├── engines/           # Engine integrations
│   │   │   ├── phases/            # Build phases
│   │   │   └── store/             # State storage
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── package.json
│   │
│   └── engines/
│       ├── execution-engine/core/  # Build command center
│       │   ├── src/
│       │   │   ├── ExecutionEngine.ts
│       │   │   ├── BuildSession.ts
│       │   │   ├── StepRegistry.ts
│       │   │   ├── StateStore.ts
│       │   │   └── receipts/
│       │   └── README.md
│       │
│       ├── identity-engine/core/   # Auth & RBAC
│       │   ├── src/
│       │   │   ├── identity.engine.ts
│       │   │   └── types.ts
│       │   └── package.json
│       │
│       ├── charter-engine/core/    # Consent & GDPR
│       │   ├── src/
│       │   │   ├── charter.engine.ts
│       │   │   └── types.ts
│       │   └── package.json
│       │
│       ├── config-engine/core/     # Feature flags
│       │   ├── src/
│       │   │   ├── config.engine.ts
│       │   │   └── types.ts
│       │   └── package.json
│       │
│       ├── paywall-engine/core/    # Pricing & billing
│       │   ├── src/
│       │   │   ├── paywall.engine.ts
│       │   │   └── types.ts
│       │   └── package.json
│       │
│       ├── notifications-engine/core/ # Email/SMS queue
│       │   ├── src/
│       │   │   ├── notifications.engine.ts
│       │   │   └── types.ts
│       │   └── package.json
│       │
│       ├── sight-engine/           # Visual quality standards
│       │   ├── src/
│       │   │   ├── types.ts
│       │   │   ├── validator.ts
│       │   │   ├── promptGenerator.ts
│       │   │   └── index.ts
│       │   └── README.md
│       │
│       └── silent-engine/core/     # AI routing
│           ├── src/
│           │   ├── silent-engine.ts
│           │   ├── providers/
│           │   │   ├── anthropic-provider.ts
│           │   │   ├── openai-provider.ts
│           │   │   ├── google-provider.ts
│           │   │   └── mock-provider.ts
│           │   ├── routing/
│           │   ├── fallback/
│           │   ├── safety/
│           │   └── observability/
│           └── README.md
│
├── supabase/
│   └── migrations/                 # 13 database migrations
│       ├── 20241225_auth_starter_v2.sql
│       ├── 20241226_identity_engine.sql
│       ├── 20241226_charter_engine.sql
│       ├── 20241226_config_engine.sql
│       ├── 20241226_paywall_engine.sql
│       ├── 20241226_notifications_engine.sql
│       ├── 20251220000001_create_sight_engine_tables.sql
│       ├── 20251220000002_create_silent_engine_tables.sql
│       ├── 20251220000003_seed_silent_engine_data.sql
│       ├── 20251223000001_create_rob_tables.sql
│       ├── 20251224000000_cleanup_old_tables.sql
│       ├── 20251230_truthserum_security.sql
│       └── 20251231_add_truthserum_public_key_95c768f8.sql
│
├── kubernetes/                     # Kubernetes deployment
│   ├── base/                      # Base configs
│   │   ├── robby/                 # Robby deployment + service
│   │   └── truthserum/            # TruthSerum deployment + service
│   └── overlays/                  # Environment-specific
│       ├── staging/
│       └── production/
│
├── scripts/                        # 42+ utility scripts
│   ├── truthgate.ts               # CI enforcement
│   ├── verify-routes.js           # Route verification
│   ├── verify-engine-pages.js     # Engine page verification
│   ├── check-dead-ends.js         # Dead-end detection
│   ├── validate-receipts.js       # Receipt validation
│   ├── production-hardening-suite.sh # Production hardening
│   └── canonical-flow.sh          # Canonical flow test
│
├── .github/workflows/              # 11 CI/CD workflows
│   ├── truthgate.yml              # Constitutional enforcement
│   ├── qbos-verify.yml            # Full system verification
│   ├── truthserum-ci.yml          # TruthSerum CI
│   ├── robby-pa-verify.yml        # Robby PA verification
│   ├── robby-pa-ci.yml            # Robby PA CI
│   ├── ci.yml                     # General CI
│   ├── ci-slim-verify.yml         # Slim verification
│   ├── build-images.yml           # Docker image building
│   ├── docker-build.yml           # Docker builds
│   ├── verify-build-and-upload.yml # Build + artifact upload
│   └── [1 more]
│
├── docs/                           # 40+ documentation files
│   ├── STATUS.md                  # Engine implementation status
│   ├── PRODUCTION_CERTIFICATE.md  # Production readiness
│   ├── INVESTOR_TRUTH_SHEET.md    # TruthSerum-verified status
│   ├── CONSTITUTIONAL_ENFORCEMENT_AUDIT.md
│   ├── TRUTHSERUM_VERIFIED_INVENTORY.md
│   ├── ROB_VERTICAL_SLICE_EXECUTION.md
│   ├── ROB_PRODUCTION_DEPLOYMENT.md
│   ├── COMPLETE_SETUP_GUIDE.md
│   ├── PROOF_GATES.md             # API test commands
│   ├── ADR/                       # Architecture decisions
│   └── auditor-handoff/           # External auditor docs
│
├── specs/                          # App specification schemas
│   ├── AppSpec.schema.json
│   └── archetypes/                # 5 archetype templates
│       ├── booking/
│       ├── crm-lite/
│       ├── saas_dashboard/
│       ├── content_app/
│       └── marketplace/
│
├── templates/
│   └── qbos-auth-starter-template/ # Authentication starter
│
├── examples/
│   ├── nextjs-demo/               # Next.js demo app
│   ├── rob-demo.ts                # Rob demonstration
│   └── rob-intelligence-demo.ts   # Rob intelligence demo
│
├── proof/                          # Proof artifacts
│   ├── bundles/                   # Proof bundles
│   ├── auditor-bundle/            # Auditor bundle
│   ├── robby-self-build/          # Robby self-build proof
│   └── witness/                   # Witness artifacts
│
├── proofs/
│   └── verified-session-2026-01-12/ # Verified session
│
├── receipts/                       # Local receipt storage
│   └── [generated receipt files]
│
├── .env.guard                      # AI tooling policy
├── .markdownlint.json             # Markdown linting
├── .yamllint                       # YAML linting
├── jest.config.js                  # Jest configuration
├── tsconfig.json                   # TypeScript config
├── package.json                    # Root package config
├── pnpm-workspace.yaml             # PNPM workspace config
└── README.md                       # This file
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/rsemeah/QBos---Master-Founder-Repo.git
cd QBos---Master-Founder-Repo
npm install
```

### 2. Run Backend (Terminal 1)
```bash
cd apps/proof-harness
npm run dev
# Wait for: ready started server on 0.0.0.0:3000
```

### 3. Run UI (Terminal 2)
```bash
cd apps/rob-ui
npm install  # First time only
npm run dev
# Wait for: Local: http://localhost:3001/
```

### 4. Test Rob the Builder
```bash
# Visit http://localhost:3001/rob
# Type: I consent
# Type: help
# See the state machine in action!
```

**Local mode generates receipts to `receipts/` directory without requiring Supabase.**

### 5. Test TruthSerum System
```bash
# Test intent evaluation
curl -X POST http://localhost:3000/api/truth/evaluate \
  -H "Content-Type: application/json" \
  -d '{"intent": "session.ready", "context": {}}'

# Read receipts
curl http://localhost:3000/api/receipts?sessionId=YOUR_SESSION_ID | jq '.'

# Test Rob chat (TruthSerum-filtered responses)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I am ready to deploy", "sessionId": "test-123"}'
```

**Full test suite:** [docs/PROOF_GATES.md](docs/PROOF_GATES.md)

### 6. Full Production Setup (Optional)

**Follow the integration guide:** [docs/COMPLETE_SETUP_GUIDE.md](docs/COMPLETE_SETUP_GUIDE.md)

**Three integrations for full production functionality:**

1. **Supabase** - Database + auth (see [SUPABASE_SETUP_STEPS.md](SUPABASE_SETUP_STEPS.md))
2. **OpenAI** - Real AI code generation (API key)
3. **GitHub OAuth** - Repo creation (optional, requires OAuth app)

**Verification:**
```bash
bash scripts/verify-supabase.sh  # Verify database setup
```

**Time:** ~10-30 minutes for full setup

---

## 📊 Implementation Status

### Engine Status Table

| Engine | Status | Lines | Production Code | Database Migration |
|--------|--------|-------|----------------|-------------------|
| ExecutionEngine™ | ✅ COMPLETE | ~2,950 | ✅ Real | ⚠️ In-memory |
| IdentityEngine™ | ✅ COMPLETE | ~373 | ✅ Real | ✅ Ready |
| CharterEngine™ | ✅ COMPLETE | ~307 | ✅ Real | ✅ Ready |
| ConfigEngine™ | ✅ COMPLETE | ~240 | ✅ Real | ✅ Ready |
| PaywallEngine™ | ✅ COMPLETE | ~270 | ✅ Real | ✅ Ready |
| NotificationsEngine™ | ✅ COMPLETE | ~230 | ✅ Real | ✅ Ready |
| SightEngine™ | ✅ PRODUCTION | ~730 | ✅ Real | ✅ Ready |
| SilentEngine™ | ✅ PRODUCTION | ~2,374 | ✅ Real | ✅ Ready |
| **TruthSerum™** | ✅ OPERATIONAL | ~794 | ✅ Real | ✅ Ready |
| **Robby PA** | 🟡 FUNCTIONAL | ~672 | ✅ Real | ⚠️ Integration pending |

**Total:** ~8,940 lines of production TypeScript
**Database:** 13 migrations, ~1,500 lines of SQL
**API Routes:** 29 routes across 8 engines
**CI/CD:** 11 workflows
**Documentation:** 40+ files
**Scripts:** 42+ utility scripts

### Application Status

| Application | Status | Description |
|------------|--------|-------------|
| proof-harness | ✅ FUNCTIONAL | Next.js backend with 29 API routes |
| rob-ui | ✅ PRODUCTION | Vite React frontend |
| robby CLI | ✅ FUNCTIONAL | CLI tool with 5 commands |

**Live Demo:** Rob builder at `/rob` with real-time receipt tracking

**See:** [docs/INVESTOR_TRUTH_SHEET.md](docs/INVESTOR_TRUTH_SHEET.md) for TruthSerum-verified status of all components

---

## 🎨 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  QuietBuild OS™ V3                           │
│             TruthSerum™-First Architecture                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🧪 TruthSerum™ (Constitutional Layer)                      │
│    └─> Evaluates intents, sanitizes claims, emits receipts  │
│         ├─> Blocks unproven operations                      │
│         ├─> Generates proof artifacts                       │
│         ├─> Keystore receipt verification                   │
│         └─> Enforces stop conditions                        │
│                                                              │
│  🤖 Robby PA (Autonomous Conductor)                          │
│    └─> Orchestrates build lifecycle                         │
│         ├─> Observe → Decide → Act loop                     │
│         ├─> State machine: INTENT → EXECUTION → VERDICT     │
│         └─> CLI tool with verification commands             │
│                                                              │
│  🏗️ ExecutionEngine™  (Command Center)                      │
│    └─> Orchestrates all other engines                       │
│         ├─> Child-readable explanations                     │
│         ├─> Idempotent step execution                       │
│         └─> Receipt generation                              │
│                                                              │
│  👤 IdentityEngine™   (Auth & RBAC)                         │
│  📜 CharterEngine™    (Consent & GDPR)                      │
│  ⚙️ ConfigEngine™     (Feature Flags)                       │
│  💰 PaywallEngine™    (Pricing & Billing)                   │
│  📬 NotificationsEngine™ (Email/SMS Queue)                  │
│  👁️ SightEngine™      (Visual Quality)                      │
│  🧠 SilentEngine™     (AI Routing)                          │
│                                                              │
│  ❌ Unproven claims         ✅ Receipt-backed operations     │
│  ❌ Mock data as real       ✅ Auditable state transitions   │
│  ❌ "Trust me" responses    ✅ Constitutional enforcement    │
│  ❌ Low-res upscales        ✅ Safety checks                 │
│  ❌ "Midjourney mush"       ✅ Audit logging                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### TruthSerum-First Flow:
1. User sends message → TruthSerum evaluates intent
2. If **Verified** → Execute operation
3. If **Unknown** → Return sanitized "cannot verify" response
4. After operation → Emit receipt with proof
5. CI enforces: No claims without receipts (TruthGate)

### Engine Integration:
- **SilentEngine** emits events → **SightEngine** validates AI-generated visuals
- **SightEngine** generates prompts → **SilentEngine** routes to best model
- **ExecutionEngine** orchestrates → All engines emit receipts
- **TruthSerum** enforces → Constitutional rules across all operations
- Shared philosophy: **Trust through precision**

---

## 📊 Key Standards

### SightEngine™ Tier A Requirements

| Standard | Value |
|----------|-------|
| Resolution | 4K minimum (3840×2160) |
| Camera | ARRI Alexa 65 / RED V-Raptor 8K |
| Lens | Prime lenses (50mm/65mm/80mm) |
| Aperture | f/2.8 - f/4.0 |
| Color Space | ACEScg (master), Display P3 (delivery) |
| Bit Depth | 16-bit |
| Lighting | Cinematic three-point or Rembrandt |

### SilentEngine™ Capabilities

| Capability | Description |
|------------|-------------|
| `long_context` | 100K+ token context |
| `tool_use` | Function calling |
| `vision` | Image understanding |
| `streaming` | Streaming responses |
| `code_generation` | Code-focused models |
| `strong_reasoning` | Complex reasoning (Claude Opus, o1) |
| `low_cost` | Cost-optimized |
| `fast_latency` | Low latency |

---

## 🧪 Example Integration

```typescript
import { SilentEngine } from '@qbos/silent-engine-core';
import { AnthropicProvider } from '@qbos/silent-engine-core/dist/providers/anthropic-provider';
import { OpenAIProvider } from '@qbos/silent-engine-core/dist/providers/openai-provider';
import { validateAsset, generatePromptHeader } from '@qbos/sight-engine';
import { TruthSerum, ReceiptWriter } from '@qbos/truthserum';

// Initialize SilentEngine
const silentEngine = new SilentEngine({
  providers: [
    new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY }),
    new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY })
  ],
  policies: [costOptimized, qualityFirst],
  defaultPolicyKey: 'cost_optimized'
});

// Generate visual with SightEngine standards
const prompt = `
${generatePromptHeader('A')}

Create a logo for CharterEngine - a legal governance system.
Style: Engineered, precise, minimal
Colors: Deep blue, white
`;

// Check TruthSerum intent before proceeding
const evaluation = await TruthSerum.evaluateIntent('visual.generate', {
  tier: 'A',
  assetType: 'logo'
});

if (evaluation.truthState === 'Verified') {
  // Generate with SilentEngine
  const result = await silentEngine.generate({
    messages: [{ role: 'user', content: prompt }],
    preferredCapabilities: ['vision', 'high_quality'],
    maxCost: 0.005
  });

  console.log('Generated visual description:', result.response.text);
  console.log('Cost:', result.actualCost);
  console.log('Provider:', result.provider);

  // Validate with SightEngine
  const validation = validateAsset(visualSpec, 'logo', 'A');
  console.log('Passes SightEngine standards:', validation.passed);
  console.log('Quality score:', validation.score);

  // Write receipt
  await ReceiptWriter.write({
    sessionId: 'session-123',
    type: 'visual.generated',
    details: {
      tier: 'A',
      score: validation.score,
      cost: result.actualCost,
      provider: result.provider
    }
  });
} else {
  console.error('Cannot proceed without verification:', evaluation.missing);
}
```

---

## 🎨 Philosophy

### SightEngine™
**Ensures you look professional.**

Visual excellence is non-negotiable for trust-based products. SightEngine™ enforces standards that separate investor-grade brands from amateur outputs.

### SilentEngine™
**Makes intelligent decisions so you don't have to.**

AI routing should be deterministic, observable, and explainable. SilentEngine™ ensures every request uses the best model for the job.

### TruthSerum™
**Proves claims instead of trusting them.**

No operation proceeds without proof. No claims accepted without receipts. Constitutional enforcement at every layer.

### Together
**Foundation of Trust for QuietBuild OS™**

- **Visual Trust** - Investor-grade visuals
- **Operational Trust** - Intelligent AI routing
- **Architectural Trust** - Composable, replaceable, auditable
- **Constitutional Trust** - Receipt-backed operations

---

## 📝 Success Criteria

✅ **An experienced engineer would say:** "This could run a serious AI platform"
✅ **An investor would say:** "This is real infrastructure"
✅ **Future-you can:** Add a brand-new LLM in minutes, not days
✅ **Auditors can:** Trace every decision through immutable receipts
✅ **Founders can:** Build with confidence, knowing every step is verified

---

## 🔮 Roadmap

### ✅ Completed
- [x] SightEngine™ - Visual quality standards
- [x] SilentEngine™ - AI routing engine with 4 providers
- [x] ExecutionEngine™ - Build command center
- [x] IdentityEngine™ - Auth & RBAC
- [x] CharterEngine™ - Consent & GDPR
- [x] ConfigEngine™ - Feature flags
- [x] PaywallEngine™ - Pricing & billing structure
- [x] NotificationsEngine™ - Email/SMS queue structure
- [x] TruthSerum™ - Constitutional enforcement system
- [x] Robby PA - Autonomous conductor (build + unit tests)
- [x] Robby CLI - Verification commands
- [x] Supabase migrations for all engines (13 migrations)
- [x] Next.js backend with 29 API routes
- [x] Vite React frontend (rob-ui)
- [x] CI TruthGate - Automated validation (11 workflows)
- [x] Receipt System - Immutable audit trail with keystore verification
- [x] Kubernetes deployment configs
- [x] Docker support with compose
- [x] 40+ documentation files
- [x] 42+ utility scripts
- [x] Monorepo setup with workspaces

### 🔄 In Progress
- [ ] Robby PA - Full integration (API + DB receipts)
- [ ] Live Stripe integration (webhook ready, needs key)
- [ ] Live email/SMS (SendGrid/Twilio integration ready)
- [ ] Production Supabase deployment
- [ ] Real authentication flow (Supabase Auth ready)

### 📋 Upcoming
- [ ] AI generation integration (Rob + SilentEngine full wiring)
- [ ] GitHub integration (code push automation)
- [ ] Vercel deployment automation
- [ ] Multi-engine orchestration dashboard
- [ ] Real-time observability UI
- [ ] Python SDK
- [ ] Streaming support for all engines
- [ ] Mobile app (React Native)

---

## 📁 What's New

### ✨ January 2026 - Production Hardening

**Robby PA Autonomous Conductor:**
- Complete autonomous build orchestration
- CLI tool with 5 commands (calibrate, verify, certify, retro, rotate-key)
- Docker + Kubernetes deployment ready
- API layer with auth middleware, cost guard, rate limiting
- State machine: INTENT → EXECUTION → VERDICT
- ~672 lines of production TypeScript

**Enhanced TruthSerum:**
- Keystore receipt verification with EdDSA signatures
- Standalone verification server
- Enhanced intent registry
- Local-first with seamless Supabase integration

**Comprehensive CI/CD:**
- 11 GitHub Actions workflows
- TruthGate constitutional enforcement
- Full system verification with PostgreSQL
- Docker image building
- Robby PA-specific verification

**Infrastructure:**
- Kubernetes manifests for staging/production
- Docker compose for local development
- 42+ utility scripts for various operations
- Production hardening suite

### ✨ December 2025 - Constitutional Infrastructure

**Rob the QuietBuilder (Vertical Slice):**
- Complete state machine with 13 states
- API routes: session init + message handler with consent gate
- Supabase-ready with mock mode fallback
- Receipt emission on every action
- Deterministic responses (AI integration ready)
- Database schema: 9 tables with RLS policies

**TruthSerum & Constitutional Enforcement:**
- Automated CI validation (GitHub Actions)
- 5 validation scripts: routes, engine pages, dead-ends, receipts, TypeScript
- Receipt system with parent-child chaining
- No unverified claims allowed in code
- Comprehensive audit documentation

**Database & Infrastructure:**
- 13 Supabase migrations (~1,500 lines SQL)
- Supabase client integration (@supabase/supabase-js)
- CharterEngine consent gate operational
- Environment variable support with placeholder enforcement
- Complete deployment guides (Supabase + Vercel)

### ✨ Previous Additions

**Provider Implementations:**
- Full Anthropic SDK integration (Claude 3.5, Opus, Haiku)
- Complete OpenAI support (GPT-4, GPT-4o, GPT-3.5)
- Google AI integration (Gemini 1.5 Pro/Flash)
- Mock provider for testing
- Cost calculation and health checks

**Next.js Adapters:**
- @qbos/nextjs-adapter package
- Type-safe API route creators
- Built-in auth support
- Streaming responses
- Automatic error handling

**Demo Applications:**
- Full-featured Next.js 14 backend (proof-harness)
- Vite React frontend (rob-ui)
- Rob vertical slice at `/rob`
- Interactive SilentEngine demo
- Interactive SightEngine demo
- Tailwind CSS UI
- Real-time validation

**Monorepo:**
- npm workspaces configuration
- Unified build scripts
- Shared dependencies
- Examples directory

---

## 📄 License

MIT

---

## 🚀 THIS IS WORLD-CHANGING INFRASTRUCTURE

**QuietBuild OS™** determines whether your product is average or inevitable.

**TruthSerum™** determines whether your claims are believable or provable.

**Robby PA** determines whether your build is manual or autonomous.

**This is inevitable.** 🧠👁️🧪🤖

---

## 🎯 Key Differentiators

### What makes QBos + TruthSerum + Robby PA unique:

1. **Constitutional Enforcement** - No operation proceeds without proof. No claims accepted without receipts. Keystore verification for immutability.

2. **Local-First Development** - Works without Supabase (local receipt fallback). Connect database only for production. Zero vendor lock-in.

3. **Investor-Grade Truth** - Every progress claim backed by proof artifacts. Truth sheet distinguishes Verified vs Unknown. Auditable receipts.

4. **CI Enforcement** - TruthGate blocks merges without receipts. 11 workflows enforce constitutional rules at build time.

5. **Rotatable Secrets** - Architecture locked, credentials rotatable. Truth rules cannot change. Security by design.

6. **Autonomous Orchestration** - Robby PA conducts builds without manual intervention. Observe → Decide → Act loop.

7. **Visual Excellence** - SightEngine enforces investor-grade quality standards. No AI-looking outputs pass validation.

8. **Intelligent Routing** - SilentEngine routes to best model based on capabilities, cost, latency. Complete observability.

9. **Graceful Degradation** - Every engine works with or without external dependencies. Local mode always functional.

10. **Production Ready** - 8,940+ lines of production TypeScript, 1,500+ lines of SQL, 29 API routes, 11 CI workflows, 40+ docs.

### For founders:
Build with confidence. Every step verified. Every claim provable. Autonomous orchestration.

### For investors:
See real progress, not promises. Immutable audit trail. Constitutional enforcement.

### For engineers:
No lies, no mocks, no "trust me." Composable, replaceable, auditable. Real infrastructure.

---

## 🛠️ Utility Commands

### Robby CLI
```bash
robby calibrate   # Calibrate system
robby verify      # Verify build
robby certify     # Generate certificate
robby retro       # Run retrospective
robby rotate-key  # Rotate keystore key
```

### Verification Scripts
```bash
bash scripts/verify-supabase.sh              # Verify Supabase setup
bash scripts/production-hardening-suite.sh   # Production hardening
bash scripts/canonical-flow.sh               # Test canonical flow
node scripts/verify-routes.js                # Verify API routes
node scripts/verify-engine-pages.js          # Verify engine pages
node scripts/check-dead-ends.js              # Check for dead-ends
node scripts/validate-receipts.js            # Validate receipts
```

### Build Commands
```bash
npm run build                    # Build all packages
npm run build:sight              # Build SightEngine
npm run build:silent             # Build SilentEngine
npm run build:engines            # Build all engines
npm run build:truthserum         # Build TruthSerum
```

### Test Commands
```bash
npm test                         # Run all tests
npm run test:unit                # Unit tests
npm run test:integration         # Integration tests
npm run test:e2e                 # End-to-end tests
```

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/rsemeah/QBos---Master-Founder-Repo/issues)
- **Documentation:** [docs/](docs/)
- **API Reference:** [docs/PROOF_GATES.md](docs/PROOF_GATES.md)
- **Production Guide:** [docs/PRODUCTION_CERTIFICATE.md](docs/PRODUCTION_CERTIFICATE.md)

---

**Built with QuietBuild OS™ V3**
*The infrastructure that makes products inevitable.*
