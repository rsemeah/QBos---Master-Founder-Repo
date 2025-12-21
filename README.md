# QuietBuild OS™

**Modular AI + Perception Foundation for Trust-Oriented Products**

QuietBuild OS is a production-ready infrastructure core built on event-driven principles. It provides intelligent AI routing, visual quality enforcement, and safety gating — the foundational engines for building trust-based products.

---

## What QuietBuild OS Is

QuietBuild OS is **NOT** a complete product operating system yet.

**It IS:**
- A modular AI + perception foundation
- A trust-oriented infrastructure core
- A system for routing, observing, and validating behavior
- Production-ready event-driven architecture

**It IS NOT:**
- A full SaaS platform (yet)
- An 18-engine system (yet)
- A complete build orchestration system (yet)

---

## The 3 Core Engines (Production-Ready)

### ✅ SilentEngine™ — AI Routing & Orchestration

**Status:** Production-ready

**Purpose:** Intelligent AI request routing with capability matching, cost optimization, and automatic fallbacks.

**Capabilities:**
- Capability-based routing (vision, tools, reasoning, streaming)
- Multi-provider abstraction (Anthropic, OpenAI, Google, etc.)
- Cost & latency constraints
- Circuit breaker with fallback chains
- Safety hooks (PII detection, jailbreak classification)
- Comprehensive observability (audit logs, event emission)

**Location:** `packages/silent-engine/`

**Example:**
```typescript
import { SilentEngine } from '@qbos/silent-engine-core';

const result = await silentEngine.generate({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  maxCost: 0.001,
  preferredCapabilities: ['low_cost', 'fast']
});
```

---

### ✅ SightEngine™ — Visual Quality & Perception

**Status:** Production-ready

**Purpose:** Enforces investor-grade visual quality standards across all product touchpoints.

**Capabilities:**
- 3 quality tiers (A: Investor, B: Product, C: Internal)
- 11 validation functions for assets
- Camera specification enforcement
- AI prompt generation with quality standards
- Comprehensive observability layer

**Location:** `packages/sight-engine/`

**Example:**
```typescript
import { validateAsset } from '@qbos/sight-engine';

const result = validateAsset(assetSpec, 'hero-image', 'A');
// Returns: { passed: true/false, tier: 'A', feedback: [...] }
```

---

### ⚠️ SafetyEngine™ — Content Moderation (Reference Implementation)

**Status:** Reference-level (usable, not complete)

**Purpose:** Content moderation, policy enforcement, and user safety gating.

**Capabilities:**
- Multi-modal moderation (text, image, video)
- Pluggable moderators (Pattern, OpenAI, Perspective)
- Safety policies with configurable actions
- Event-driven moderation workflow
- Integrates with SilentEngine for pre/post safety checks

**Location:** `packages/engines/safety-engine/`

**Example:**
```typescript
import { SafetyEngine } from '@qbos/safety-engine-core';

const safetyEngine = new SafetyEngine();
await safetyEngine.init();

// Content is moderated via events
await eventBus.emit('post.content.created', {
  content: 'User content here',
  contentType: 'text'
});
```

---

## 3 Planned Engines (Not Implemented)

These engines are **planned** but do not exist yet:

### 📋 CharterEngine™ — Legal & Consent
**Purpose:** GDPR compliance, legal document management, cookie consent

### 📋 ExecutionEngine™ — Interactive Build Command Center
**Purpose:** Build orchestration, interactive execution, system control

### 📋 ConfigEngine™ — System Control Plane
**Purpose:** Feature flags, A/B testing, configuration management

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        QuietBuild OS™                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐│
│  │  Next.js   │  │  Worker    │  │  Worker    │  │  Cron     ││
│  │  Web App   │  │  Process   │  │  Process   │  │  Jobs     ││
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └─────┬─────┘│
│         │               │                │               │      │
│         └───────────────┴────────────────┴───────────────┘      │
│                            │                                     │
│                ┌───────────▼──────────────┐                     │
│                │ Event Bus (Database)     │                     │
│                │ • qbos_events table      │                     │
│                │ • Idempotent insertion   │                     │
│                │ • Retry with backoff     │                     │
│                │ • Worker locking         │                     │
│                └───────────┬──────────────┘                     │
│                            │                                     │
│         ┌──────────────────┴──────────────────┐                │
│         │                                       │                │
│    ┌────▼─────┐  ┌──────────┐  ┌──────────┐                   │
│    │ Silent™  │  │ Sight™   │  │ Safety™  │                   │
│    │ (AI)     │  │ (Visual) │  │ (Content)│                   │
│    │ ✅        │  │ ✅        │  │ ⚠️        │                   │
│    └──────────┘  └──────────┘  └──────────┘                   │
│                                                                  │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│    │Charter™  │  │Execution™│  │ Config™  │                   │
│    │(Legal)   │  │(Build)   │  │(Flags)   │                   │
│    │ 📋        │  │ 📋        │  │ 📋        │                   │
│    └──────────┘  └──────────┘  └──────────┘                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                   Foundation Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │  Database   │  │   Events    │  │  Runtime (Bootstrap)    ││
│  │  (Postgres) │  │  (Outbox)   │  │  (Engine Registry)      ││
│  │  ✅          │  │  ✅          │  │  ✅                      ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

Legend: ✅ Complete | ⚠️  Reference | 📋 Planned
```

---

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build All Packages

```bash
pnpm build
```

### 3. Set Up Supabase

Create `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

### 5. Use the Engines

```typescript
import { SilentEngine } from '@qbos/silent-engine-core';
import { validateAsset } from '@qbos/sight-engine';
import { SafetyEngine } from '@qbos/safety-engine-core';

// AI Routing
const silentEngine = new SilentEngine(config);
const result = await silentEngine.generate({
  messages: [{ role: 'user', content: 'Hello' }]
});

// Visual Quality
const visualCheck = validateAsset(spec, 'logo', 'A');

// Safety Moderation
const safetyEngine = new SafetyEngine();
await safetyEngine.init();
```

---

## Repository Structure

```
qbos-master-founder-repo/
├── packages/
│   ├── database/              # ✅ Database migrations & types
│   ├── events/                # ✅ Event bus implementations
│   ├── runtime/               # ✅ Engine orchestration
│   │
│   ├── silent-engine/         # ✅ AI routing & orchestration
│   │   └── core/
│   │       ├── src/
│   │       │   ├── silent-engine.ts
│   │       │   ├── routing/
│   │       │   ├── safety/
│   │       │   ├── fallback/
│   │       │   └── observability/
│   │       └── README.md
│   │
│   ├── sight-engine/          # ✅ Visual quality standards
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── validator.ts
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   └── engines/
│       └── safety-engine/     # ⚠️  Content moderation (reference)
│           └── core/
│               ├── src/
│               └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md        # Complete system design
│   ├── GETTING_STARTED.md     # Setup guide
│   ├── ENGINE_IMPLEMENTATION_GUIDE.md
│   └── NO_CODE_LLM_GUIDE.md
│
├── apps/
│   └── proof-harness/         # Testing & validation harness
│
└── README.md                  # This file
```

---

## Core Principles

### 1. Event-Driven Everything

All engines communicate via events. No direct coupling.

```typescript
// ❌ BAD: Direct coupling
await paymentEngine.charge(userId, amount);

// ✅ GOOD: Event-driven
await eventBus.emit('payment.charge.requested', { userId, amount });
```

### 2. Database as Source of Truth

Events are persisted in `qbos_events` table. No in-memory queues in production.

### 3. Security First

Row Level Security (RLS) on all user-facing tables. SECURITY DEFINER functions for privileged operations.

### 4. Production-Ready

Built-in retry logic, exponential backoff, circuit breakers, audit logs.

---

## What's Next

See [`docs/STATUS.md`](docs/STATUS.md) for current development status and roadmap.

**Immediate Priorities:**
1. Complete ExecutionEngine™ (interactive build command center)
2. Implement ConfigEngine™ (feature flags, A/B testing)
3. Build CharterEngine™ (GDPR compliance)

---

## Documentation

| Document | Description |
|----------|-------------|
| `docs/ARCHITECTURE.md` | Complete system architecture |
| `docs/GETTING_STARTED.md` | Setup and installation guide |
| `docs/STATUS.md` | Current status and roadmap |
| `docs/ENGINE_IMPLEMENTATION_GUIDE.md` | How to build new engines |
| `docs/NO_CODE_LLM_GUIDE.md` | Build with Claude, Cursor, Bolt |

---

## License

MIT

---

## QuietBuild OS™ — The Truth

**3 Production Engines:**
- SilentEngine™ — AI routing & orchestration
- SightEngine™ — Visual quality & perception
- SafetyEngine™ — Content moderation (reference)

**3 Planned Engines:**
- CharterEngine™ — Legal & consent
- ExecutionEngine™ — Build command center
- ConfigEngine™ — System control plane

**Foundation:**
- Event-driven architecture
- Database-backed event bus
- Production-ready infrastructure
- Type-safe TypeScript throughout

This is a **trust-oriented AI + perception foundation**, not a full product OS yet.

**This is the truth.** 🎯
