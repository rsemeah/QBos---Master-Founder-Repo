# QuietBuild OS - System Architecture

**Production-Grade Event-Driven Operating System for Modern Applications**

Version: 1.0.0
Last Updated: 2025-12-20

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [System Architecture](#system-architecture)
4. [Foundation Layer](#foundation-layer)
5. [Engine Ecosystem](#engine-ecosystem)
6. [Event-Driven Coordination](#event-driven-coordination)
7. [Database Schema](#database-schema)
8. [Security Model](#security-model)
9. [Deployment Architecture](#deployment-architecture)
10. [Scalability & Performance](#scalability--performance)

---

## Overview

QuietBuild OS is an event-driven operating system designed for building production-grade SaaS applications. It provides a foundation of 8 core engines that handle authentication, AI routing, visual quality, content safety, payments, notifications, compliance, and feature flags.

### Key Characteristics

- **Event-Driven**: All engines communicate through database-backed events
- **Modular**: Each engine is independently deployable and scalable
- **Production-Ready**: RLS, audit logs, retries, circuit breakers built-in
- **Type-Safe**: Full TypeScript with strict mode
- **Monorepo**: Managed with pnpm + Turborepo

---

## Core Principles

### 1. Event Sourcing Over Direct Calls

**Why**: Decoupling, reliability, auditability

```typescript
// ❌ BAD: Direct coupling
await paymentEngine.charge(userId, amount);

// ✅ GOOD: Event-driven
await eventBus.emit('payment.charge.requested', { userId, amount });
```

**Benefits**:
- Engines never directly depend on each other
- All state changes are auditable
- Retry logic built into event processing
- Can replay events for debugging

### 2. Database as Source of Truth

**Why**: Durability, distributed coordination, simplicity

All events are persisted in `qbos_events` table before processing. No in-memory queues in production.

```sql
CREATE TABLE qbos_events (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'failed_permanent')),
  ...
);
```

**Benefits**:
- No lost events during crashes
- Built-in retry with exponential backoff
- Distributed workers can claim events atomically
- Simple to reason about (no Redis, no Kafka)

### 3. Row Level Security (RLS) First

**Why**: Security cannot be optional

All user-facing tables use Postgres RLS. Application code cannot bypass security.

```sql
-- Users can only see their own profiles
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = user_id);
```

**Benefits**:
- Security enforced at database level
- Cannot be bypassed by buggy application code
- Multi-tenancy built-in
- Audit trails automatic

### 4. SECURITY DEFINER Functions for Privileged Operations

**Why**: Controlled access to sensitive operations

```sql
CREATE OR REPLACE FUNCTION insert_qbos_event(...)
SECURITY DEFINER  -- Runs with elevated privileges
SET search_path = public
AS $$
  -- Controlled insert into RLS-protected table
$$;
```

**Benefits**:
- Fine-grained access control
- Audit trail of who called what
- Cannot directly modify sensitive tables

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        QuietBuild OS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐│
│  │  Next.js   │  │  Worker    │  │  Worker    │  │  Cron Jobs││
│  │  Web App   │  │  Process   │  │  Process   │  │           ││
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └─────┬─────┘│
│         │               │                │               │      │
│         └───────────────┴────────────────┴───────────────┘      │
│                            │                                     │
│                     Event Bus (Database)                         │
│                            │                                     │
│         ┌──────────────────┴──────────────────┐                │
│         │                                       │                │
│    ┌────▼─────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│    │ Silent™  │  │ Sight™   │  │ Safety™  │  │ Identity™  │  │
│    │ (AI)     │  │ (Visual) │  │ (Content)│  │ (Auth)     │  │
│    └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                                  │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│    │Paywall™  │  │Notifs™   │  │Charter™  │  │ Config™    │  │
│    │(Payments)│  │(Messaging│  │(Legal)   │  │(Flags)     │  │
│    └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                   Foundation Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │  Database   │  │   Events    │  │  Runtime (Bootstrap)    ││
│  │  (Postgres) │  │  (Outbox)   │  │  (Engine Registry)      ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Foundation Layer

### Database Package (`@qbos/database`)

**Purpose**: Database migrations, types, and schema management

**Key Files**:
- `migrations/000_foundations.sql` - Event outbox, profiles, audit log
- `src/index.ts` - TypeScript types for all tables

**Migrations**:
```bash
pnpm --filter @qbos/database migrate
```

**Schema Overview**:
- `qbos_events` - Event outbox (all engine coordination)
- `profiles` - User profile extensions
- `audit_log` - System-wide event tracking

### Events Package (`@qbos/events`)

**Purpose**: Event bus abstraction + implementations

**Adapters**:
1. **InMemoryEventBus**: Development/testing (synchronous, no persistence)
2. **DatabaseEventBus**: Production (database-backed, distributed workers)

**Usage**:
```typescript
import { DatabaseEventBus } from '@qbos/events';

const eventBus = new DatabaseEventBus({ supabase });
await eventBus.start(); // Start worker loop

// Emit event
await eventBus.emit('user.created', { userId: '123' });

// Subscribe
eventBus.on('user.*', async (event) => {
  console.log('User event:', event);
});
```

### Runtime Package (`@qbos/runtime`)

**Purpose**: Engine lifecycle management and orchestration

**Key Components**:
1. **BaseEngine**: Abstract class all engines extend
2. **EngineRegistry**: Manages engine dependencies and initialization order
3. **bootstrap()**: Main entry point to start QuietBuild OS

**Engine Lifecycle**:
```
initialize() → start() → [running] → stop()
```

**Dependency Resolution**:
```typescript
const safetyEngine = {
  metadata: {
    id: 'safety-engine',
    dependencies: ['identity-engine'], // Wait for identity first
  },
};

// Registry ensures identity-engine initializes before safety-engine
```

---

## Engine Ecosystem

### 1. SilentEngine™ (AI Routing)

**Status**: ✅ COMPLETE (from previous integration)

**Purpose**: Multi-provider AI routing with fallbacks and circuit breakers

**Features**:
- Route to best AI provider (Anthropic, OpenAI, Google)
- Automatic fallback on failures
- Circuit breaker pattern
- Cost optimization
- Response caching

**Location**: `packages/engines/silent-engine/`

### 2. SightEngine™ (Visual Quality)

**Status**: ✅ COMPLETE (from previous integration)

**Purpose**: Visual content validation and quality enforcement

**Features**:
- 11 validation functions
- Device-specific quality tiers
- Camera specification validation
- Image quality analysis
- Resolution enforcement

**Location**: `packages/engines/sight-engine/`

### 3. SafetyEngine™ (Content Moderation)

**Status**: ✅ COMPLETE (reference implementation)

**Purpose**: Content moderation, policy enforcement, user reputation

**Features**:
- Multi-modal moderation (text, images, video)
- Pluggable moderators (Pattern, OpenAI, Perspective)
- Safety policies with actions
- User reputation tracking
- Event-driven moderation workflow

**Location**: `packages/engines/safety-engine/`

**Events**:
- Listens: `*.content.created`, `*.content.updated`
- Emits: `safety.content.approved`, `safety.content.flagged`, `safety.content.rejected`

### 4. IdentityEngine™ (Auth & RBAC)

**Status**: 📋 PLANNED

**Purpose**: Authentication, authorization, role-based access control

**Planned Features**:
- Supabase Auth integration
- Role and permission management
- Multi-factor authentication
- Session management
- OAuth providers

**Events**:
- Emits: `identity.user.created`, `identity.user.login`, `identity.role.assigned`

### 5. PaywallEngine™ (Payments)

**Status**: 📋 PLANNED

**Purpose**: Subscription management, billing, payment processing

**Planned Features**:
- Stripe integration
- Subscription lifecycle management
- Usage-based billing
- Invoice generation
- Webhook handling

**Events**:
- Emits: `paywall.subscription.created`, `paywall.payment.succeeded`, `paywall.payment.failed`

### 6. NotificationsEngine™ (Multi-Channel Messaging)

**Status**: 📋 PLANNED

**Purpose**: Email, SMS, push, in-app notifications

**Planned Features**:
- Multi-channel delivery (email, SMS, push)
- Template management
- Delivery tracking
- User preferences
- Rate limiting

**Events**:
- Listens: `*.notification.send`
- Emits: `notifications.sent`, `notifications.failed`

### 7. CharterEngine™ (Legal Compliance)

**Status**: 📋 PLANNED

**Purpose**: Terms of service, privacy policy, GDPR compliance

**Planned Features**:
- Terms acceptance tracking
- GDPR data export/deletion
- Cookie consent management
- Compliance reporting
- Legal document versioning

**Events**:
- Emits: `charter.terms.accepted`, `charter.data.export.requested`

### 8. ConfigEngine™ (Feature Flags)

**Status**: 📋 PLANNED

**Purpose**: Feature flags, A/B testing, gradual rollouts

**Planned Features**:
- Feature flag management
- User/group targeting
- A/B test experiments
- Percentage rollouts
- Real-time flag updates

**Events**:
- Emits: `config.flag.enabled`, `config.flag.disabled`

---

## Event-Driven Coordination

### Event Flow

```
1. User Action
   ↓
2. Application emits event
   ↓
3. Event inserted into qbos_events (idempotent)
   ↓
4. Worker fetches and locks event (FOR UPDATE SKIP LOCKED)
   ↓
5. Event dispatched to matching handlers
   ↓
6. Handlers process event
   ↓
7. Success? → mark_event_processed()
   Failure? → mark_event_failed() with retry
```

### Event Naming Convention

Format: `{engine}.{resource}.{action}`

Examples:
- `user.profile.created`
- `sight.image.validated`
- `safety.content.rejected`
- `paywall.subscription.created`

### Idempotency

All events require idempotency keys to prevent duplicate processing:

```typescript
await eventBus.emit('payment.charge.requested', payload, {
  idempotencyKey: `payment:charge:${userId}:${orderId}`,
});
```

If event with same key already exists, returns existing event ID.

### Retry Logic

Failed events automatically retry with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: +2 minutes
Attempt 3: +4 minutes
Attempt 4: +8 minutes
Attempt 5: +16 minutes
After 5 attempts: failed_permanent
```

---

## Database Schema

### Event Outbox (`qbos_events`)

```sql
CREATE TABLE qbos_events (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,                    -- Event name (e.g., "user.created")
  payload JSONB NOT NULL,                -- Event data
  metadata JSONB DEFAULT '{}',           -- Source engine, timestamps, etc.
  idempotency_key TEXT UNIQUE,           -- Prevents duplicates
  status TEXT,                           -- pending, processing, processed, failed
  attempt_count INTEGER DEFAULT 0,       -- Retry counter
  next_attempt_at TIMESTAMPTZ,           -- When to retry
  locked_at TIMESTAMPTZ,                 -- Worker lock timestamp
  locked_by TEXT,                        -- Worker ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT                             -- Last error message
);
```

### Profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only access their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = user_id);
```

### Audit Log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,                  -- Action performed
  resource_type TEXT NOT NULL,           -- Type of resource
  resource_id TEXT,                      -- Resource ID
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only see their own audit logs
CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Security Model

### Multi-Layered Security

1. **Row Level Security (RLS)**: Database-enforced access control
2. **SECURITY DEFINER Functions**: Controlled privileged operations
3. **Service Role Key**: Required for event bus workers
4. **Anon Key**: Public client access with RLS
5. **Audit Logs**: All actions tracked

### RLS Pattern

```sql
-- 1. Enable RLS on table
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for each operation
CREATE POLICY my_table_select ON my_table
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY my_table_insert ON my_table
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY my_table_update ON my_table
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY my_table_delete ON my_table
  FOR DELETE USING (user_id = auth.uid());
```

### Privileged Operations

For operations that need to bypass RLS (e.g., event insertion):

```sql
CREATE OR REPLACE FUNCTION privileged_operation(...)
SECURITY DEFINER  -- Runs as function owner (bypasses RLS)
SET search_path = public  -- Prevent schema hijacking
AS $$
  -- Controlled access to protected data
$$;

GRANT EXECUTE ON FUNCTION privileged_operation TO authenticated;
```

---

## Deployment Architecture

### Development

```
Single Process:
├── Next.js Dev Server (port 3000)
├── InMemoryEventBus (synchronous)
└── All engines in-process
```

### Production

```
Multi-Process:
├── Next.js App (Vercel)
├── Worker 1 (Render/Railway)
│   └── DatabaseEventBus (polls qbos_events)
├── Worker 2 (Render/Railway)
│   └── DatabaseEventBus (polls qbos_events)
└── Supabase (Database + Auth + Storage)
```

### Worker Configuration

```typescript
// worker.ts
import { bootstrap, loadConfigFromEnv } from '@qbos/runtime';
import { SafetyEngine } from '@qbos/safety-engine-core';
// ... import other engines

const config = loadConfigFromEnv();
const qbos = await bootstrap(config, [
  new SafetyEngine(),
  // ... other engines
]);

await qbos.start(); // Start event processing
```

---

## Scalability & Performance

### Horizontal Scaling

Add more workers to process events faster:

```bash
# Worker 1
WORKER_ID=worker-1 node dist/worker.js

# Worker 2
WORKER_ID=worker-2 node dist/worker.js
```

Workers coordinate via database locks (`FOR UPDATE SKIP LOCKED`).

### Performance Characteristics

- **Event Insertion**: ~5ms (database write)
- **Event Processing**: Depends on handler (50ms - 5s)
- **Worker Poll Interval**: 1s default (configurable)
- **Max Events/Batch**: 100 default (configurable)

### Bottlenecks & Solutions

| Bottleneck | Solution |
|------------|----------|
| Database writes | Use connection pooling (Supabase Pooler) |
| Event processing | Add more workers |
| Handler slowness | Optimize handler code, use caching |
| Event accumulation | Scale workers, increase poll frequency |

### Monitoring

```typescript
// Health check
const health = await qbos.healthCheck();
// { 'safety-engine': true, 'silent-engine': true, ... }

// Event metrics
SELECT status, COUNT(*) FROM qbos_events GROUP BY status;
```

---

## Next Steps

1. **Implement Remaining 5 Engines**: Use SafetyEngine as template
2. **Add Observability**: Integrate Sentry, Datadog, or PostHog
3. **Deploy Workers**: Set up production worker processes
4. **Create Admin Dashboard**: Monitor events, engines, users
5. **Write Integration Tests**: Test cross-engine workflows

---

## Resources

- **Getting Started**: `docs/GETTING_STARTED.md`
- **Engine Implementation Guide**: `docs/ENGINE_IMPLEMENTATION_GUIDE.md`
- **No-Code LLM Guide**: `docs/NO_CODE_LLM_GUIDE.md`
- **SafetyEngine README**: `packages/engines/safety-engine/README.md`

---

**QuietBuild OS** - Production-Grade Event-Driven Operating System
Version 1.0.0 | Built with TypeScript, Supabase, and ❤️
