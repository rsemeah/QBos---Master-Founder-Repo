# QuietBuild OS - 18 Engine Implementation Plan

**Document Version:** 1.0.0
**Date:** 2025-12-21
**Status:** Pre-Implementation Review
**Target:** World-Class Production-Ready Code

---

## Executive Summary

This document outlines the comprehensive implementation plan for building all 18 QuietBuild OS engines with production-ready code. This is NOT a proof-of-concept - every engine will be complete with TypeScript implementations, database migrations, RLS policies, and comprehensive documentation.

**Non-Negotiables:**
- ✅ NO placeholders or TODOs
- ✅ Complete working TypeScript for every file
- ✅ Full database migrations with RLS policies
- ✅ Comprehensive documentation per engine
- ✅ Product-agnostic design (QBos foundation, NOT a product)
- ✅ Event-driven architecture throughout

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Engine Inventory & Dependencies](#engine-inventory--dependencies)
3. [Architectural Questions & Answers](#architectural-questions--answers)
4. [Phased Build Strategy](#phased-build-strategy)
5. [Implementation Standards](#implementation-standards)
6. [Database Migration Strategy](#database-migration-strategy)
7. [Testing & Validation Approach](#testing--validation-approach)
8. [Risk Assessment](#risk-assessment)
9. [Success Criteria](#success-criteria)

---

## 1. Current State Analysis

### Existing Engines (3)

| Engine | Location | Package Name | Status |
|--------|----------|--------------|--------|
| **SilentEngine™** | `packages/silent-engine/core` | `@qbos/silent-engine-core` | ✅ Complete |
| **SightEngine™** | `packages/sight-engine` | `@qbos/sight-engine` | ✅ Complete |
| **SafetyEngine™** | `packages/engines/safety-engine/core` | `@qbos/safety-engine-core` | ✅ Complete |

### Existing Foundation Packages (4)

| Package | Location | Purpose | Status |
|---------|----------|---------|--------|
| **database** | `packages/database` | Supabase schema & migrations | ✅ Complete |
| **events** | `packages/events` | Event bus abstraction (in-memory + DB) | ✅ Complete |
| **runtime** | `packages/runtime` | Core runtime utilities | ✅ Complete |
| **proof-harness** | `apps/proof-harness` | API verification endpoints | ✅ Complete |

### Workspace Structure

```yaml
packages:
  - 'packages/*'                    # Foundation packages
  - 'packages/engines/*'            # Engine root directories
  - 'packages/engines/*/core'       # Engine core implementation
  - 'packages/engines/*/supabase'   # Engine database schemas
  - 'apps/*'                        # Applications
```

### Package Manager

**Detected:** pnpm@8.12.0 (from packageManager field)

---

## 2. Engine Inventory & Dependencies

### All 18 Engines

| # | Engine | Purpose | Depends On | Priority |
|---|--------|---------|------------|----------|
| 1 | **IdentityEngine** | Auth, users, roles, teams | database, events | P0 (Core) |
| 2 | **SafetyEngine** | Content moderation, PII detection | database, events | P0 (Core) |
| 3 | **ConfigEngine** | Feature flags, A/B testing | database, events | P0 (Core) |
| 4 | **CharterEngine** | Legal compliance, GDPR, consent | database, events, IdentityEngine | P1 (Governance) |
| 5 | **VaultEngine** | File storage, CDN integration | database, events, IdentityEngine | P1 (Storage) |
| 6 | **NotificationsEngine** | Email, SMS, push notifications | database, events, IdentityEngine | P2 (Comms) |
| 7 | **JourneysEngine** | User flows, onboarding, funnels | database, events, IdentityEngine | P2 (Experience) |
| 8 | **CommsEngine** | Messaging, comments, threads | database, events, IdentityEngine, SafetyEngine | P1 (Content) |
| 9 | **SubscriptionEngine** | Billing cycles, subscription mgmt | database, events, IdentityEngine | P2 (Business) |
| 10 | **PaywallEngine** | Stripe integration, payments | database, events, IdentityEngine, SubscriptionEngine | P2 (Business) |
| 11 | **SilentEngine** | AI provider routing | events | P0 (Core) |
| 12 | **SightEngine** | Visual quality standards | events | P0 (Core) |
| 13 | **ExecutionEngine** | Build orchestration, CI/CD | database, events, IdentityEngine | P2 (DevOps) |
| 14 | **TestingEngine** | QA automation, test orchestration | database, events, ExecutionEngine | P2 (DevOps) |
| 15 | **ContentEngine** | CMS, content versioning | database, events, IdentityEngine, SafetyEngine | P1 (Content) |
| 16 | **AdminEngine** | System management, ops tools | database, events, IdentityEngine | P1 (Governance) |
| 17 | **CompassEngine** | Product discovery, feature registry | database, events | P2 (Discovery) |
| 18 | **EthosEngine** | Ethical AI, bias detection | database, events, SilentEngine, SafetyEngine | P1 (Governance) |

### Dependency Graph (Simplified)

```
database + events (foundation)
    │
    ├─► IdentityEngine (P0 - FIRST)
    │       │
    │       ├─► CharterEngine
    │       ├─► VaultEngine
    │       ├─► NotificationsEngine
    │       ├─► JourneysEngine
    │       ├─► CommsEngine ◄──┐
    │       ├─► SubscriptionEngine   │
    │       │       │                │
    │       │       └─► PaywallEngine│
    │       ├─► ExecutionEngine      │
    │       │       │                │
    │       │       └─► TestingEngine│
    │       ├─► ContentEngine ───────┘
    │       └─► AdminEngine
    │
    ├─► SafetyEngine (P0 - EXISTS, enhance)
    │       │
    │       ├─► CommsEngine
    │       ├─► ContentEngine
    │       └─► EthosEngine
    │
    ├─► ConfigEngine (P0 - SECOND)
    │
    ├─► SilentEngine (P0 - EXISTS)
    │       │
    │       └─► EthosEngine
    │
    ├─► SightEngine (P0 - EXISTS)
    │
    └─► CompassEngine (P2 - standalone)
```

---

## 3. Architectural Questions & Answers

### Q1: How should engines communicate?

**Answer:** Event-driven architecture using the `@qbos/events` package.

**Pattern:**
```typescript
// Engine emits events
await eventBus.emit('identity.user.created', {
  userId: 'user_123',
  email: 'user@example.com',
  timestamp: new Date().toISOString()
});

// Other engines subscribe
eventBus.on('identity.user.created', async (event) => {
  // CharterEngine creates default consent record
  // NotificationsEngine sends welcome email
  // JourneysEngine starts onboarding flow
});
```

**Benefits:**
- Loose coupling between engines
- Event replay for debugging
- Audit trail built-in
- Easy to add new engines without modifying existing ones

---

### Q2: What's the database migration strategy?

**Answer:** Each engine with database needs gets its own migration in `packages/database/supabase/migrations/`.

**Naming Convention:**
```
YYYYMMDDHHMMSS_engine_name_description.sql
```

**Structure:**
```sql
-- Migration: 20251221120000_identity_engine_foundation.sql

-- 1. Create tables
CREATE TABLE IF NOT EXISTS identity_users (...);
CREATE TABLE IF NOT EXISTS identity_roles (...);

-- 2. Create indexes
CREATE INDEX idx_identity_users_email ON identity_users(email);

-- 3. Enable RLS
ALTER TABLE identity_users ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can read own data"
  ON identity_users FOR SELECT
  USING (auth.uid() = id);

-- 5. Create functions (SECURITY DEFINER where needed)
CREATE OR REPLACE FUNCTION identity_create_user(...)
RETURNS TABLE(...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Implementation
END;
$$;

-- 6. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON identity_users TO authenticated;
```

**Migration Order:**
1. IdentityEngine (users, roles, teams) - FIRST
2. Other engines in dependency order

---

### Q3: How to ensure RLS policies are consistent?

**Answer:** Use a standardized RLS policy template for all engines.

**Template Patterns:**

1. **User Data Pattern** (user owns the row)
```sql
-- Read own data
CREATE POLICY "policy_name_select"
  ON table_name FOR SELECT
  USING (user_id = auth.uid());

-- Update own data
CREATE POLICY "policy_name_update"
  ON table_name FOR UPDATE
  USING (user_id = auth.uid());
```

2. **Role-Based Pattern** (admin can do anything)
```sql
-- Admin full access
CREATE POLICY "policy_name_admin"
  ON table_name FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
    )
  );
```

3. **Public Read Pattern** (anyone can read, authenticated can write)
```sql
-- Public read
CREATE POLICY "policy_name_public_read"
  ON table_name FOR SELECT
  USING (true);

-- Authenticated write
CREATE POLICY "policy_name_authenticated_write"
  ON table_name FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

---

### Q4: How to structure shared types and utilities?

**Answer:** Each engine exports its own types. Shared utilities go in `@qbos/runtime`.

**Engine Structure:**
```
packages/engines/ENGINE-NAME/
├── core/
│   ├── package.json                    # @qbos/ENGINE-NAME-core
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                    # Public API exports
│   │   ├── types.ts                    # Engine-specific types
│   │   ├── ENGINE-NAME.engine.ts       # Main engine class
│   │   ├── services/                   # Business logic services
│   │   │   ├── service1.ts
│   │   │   └── service2.ts
│   │   ├── models/                     # Data models (if needed)
│   │   └── utils/                      # Engine-specific utilities
│   └── README.md                       # Engine documentation
└── supabase/
    └── README.md                        # Database schema documentation
```

**Type Export Pattern:**
```typescript
// src/types.ts
export interface EngineConfig {
  enabled: boolean;
  // ...
}

export interface EngineResult {
  ok: boolean;
  // ...
}

// src/index.ts
export type { EngineConfig, EngineResult } from './types';
export { EngineClass } from './ENGINE-NAME.engine';
```

---

### Q5: How to make all engines truly product-agnostic?

**Answer:** Follow these principles:

1. **No Product Assumptions**
   - ✅ DO: `createUser(email, metadata)`
   - ❌ DON'T: `createShopifyCustomer(email)`

2. **Metadata Pattern for Extensibility**
   ```typescript
   interface User {
     id: string;
     email: string;
     metadata: Record<string, any>; // Product-specific data goes here
   }
   ```

3. **Event Naming Convention**
   - Format: `engine.entity.action`
   - Example: `identity.user.created`, `vault.file.uploaded`

4. **Configuration Over Hard-coding**
   ```typescript
   // Engine configuration
   interface VaultConfig {
     storageProvider: 'supabase' | 's3' | 'gcs';
     maxFileSize: number;
     allowedMimeTypes: string[];
   }
   ```

5. **No UI/Frontend Code in Engines**
   - Engines are backend-only
   - Return data, not HTML/React components

---

### Q6: How to handle engine initialization and startup?

**Answer:** Each engine follows a standard initialization pattern.

**Pattern:**
```typescript
export class EngineNameEngine {
  private config: EngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: EngineConfig, eventBus: EventBus) {
    this.config = config;
    this.eventBus = eventBus;
  }

  /**
   * Initialize the engine
   * - Set up event subscriptions
   * - Validate configuration
   * - Connect to external services
   */
  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('Engine already initialized');
    }

    // Register event handlers
    this.eventBus.on('some.event', this.handleEvent.bind(this));

    // Validate config
    this.validateConfig();

    this.initialized = true;
  }

  /**
   * Shutdown the engine gracefully
   */
  async shutdown(): Promise<void> {
    // Cleanup resources
    this.initialized = false;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    if (!this.initialized) {
      return { ok: false, message: 'Engine not initialized' };
    }
    return { ok: true };
  }
}
```

---

## 4. Phased Build Strategy

### Phase 1: Core Infrastructure Engines (Days 1-2)

**Engines:**
1. **IdentityEngine** - Foundation for all user-related operations
2. **ConfigEngine** - Feature flags and configuration
3. **SafetyEngine Enhancement** - Extend existing implementation

**Why First:**
- Almost every other engine depends on IdentityEngine
- ConfigEngine enables feature flagging for gradual rollout
- SafetyEngine is already started, just needs completion

**Deliverables:**
- ✅ IdentityEngine: Users, roles, teams, sessions
- ✅ ConfigEngine: Feature flags, A/B tests, configuration management
- ✅ SafetyEngine: Enhanced moderation policies
- ✅ Database migrations for all three
- ✅ RLS policies for all tables
- ✅ Complete TypeScript implementations
- ✅ READMEs with examples

---

### Phase 2: Content & Storage Engines (Days 3-4)

**Engines:**
1. **VaultEngine** - File storage and management
2. **ContentEngine** - CMS and content versioning
3. **CommsEngine** - Messaging and comments

**Dependencies:**
- All depend on IdentityEngine
- ContentEngine and CommsEngine depend on SafetyEngine

**Deliverables:**
- ✅ VaultEngine: Upload, download, CDN integration
- ✅ ContentEngine: Create, version, publish content
- ✅ CommsEngine: Threads, messages, mentions
- ✅ Database migrations
- ✅ RLS policies
- ✅ Complete implementations

---

### Phase 3: Business Engines (Days 5-6)

**Engines:**
1. **SubscriptionEngine** - Billing and subscription management
2. **PaywallEngine** - Stripe integration and payments
3. **JourneysEngine** - User flows and onboarding

**Dependencies:**
- All depend on IdentityEngine
- PaywallEngine depends on SubscriptionEngine

**Deliverables:**
- ✅ SubscriptionEngine: Plans, billing cycles, usage tracking
- ✅ PaywallEngine: Stripe webhooks, payment processing
- ✅ JourneysEngine: Flow definitions, step tracking
- ✅ Database migrations
- ✅ RLS policies
- ✅ Complete implementations

---

### Phase 4: Governance Engines (Days 7-8)

**Engines:**
1. **CharterEngine** - Legal compliance and consent
2. **EthosEngine** - Ethical AI and bias detection
3. **AdminEngine** - System management

**Dependencies:**
- CharterEngine depends on IdentityEngine
- EthosEngine depends on SilentEngine and SafetyEngine
- AdminEngine depends on IdentityEngine

**Deliverables:**
- ✅ CharterEngine: GDPR, consent, legal docs
- ✅ EthosEngine: Bias detection, ethical guidelines
- ✅ AdminEngine: System monitoring, user management
- ✅ Database migrations
- ✅ RLS policies
- ✅ Complete implementations

---

### Phase 5: Development Engines (Days 9-10)

**Engines:**
1. **ExecutionEngine** - Build orchestration
2. **TestingEngine** - QA automation
3. **CompassEngine** - Product discovery
4. **NotificationsEngine** - Email, SMS, push

**Dependencies:**
- ExecutionEngine depends on IdentityEngine
- TestingEngine depends on ExecutionEngine
- CompassEngine is standalone
- NotificationsEngine depends on IdentityEngine

**Deliverables:**
- ✅ ExecutionEngine: Build pipelines, job orchestration
- ✅ TestingEngine: Test suites, coverage tracking
- ✅ CompassEngine: Feature discovery, analytics
- ✅ NotificationsEngine: Multi-channel notifications
- ✅ Database migrations
- ✅ RLS policies
- ✅ Complete implementations

---

## 5. Implementation Standards

### TypeScript Standards

1. **Strict Mode Enabled**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true
     }
   }
   ```

2. **Explicit Return Types**
   ```typescript
   // ✅ GOOD
   async function createUser(email: string): Promise<User> {
     // ...
   }

   // ❌ BAD
   async function createUser(email: string) {
     // ...
   }
   ```

3. **No `any` Type** (except for metadata/JSON fields)
   ```typescript
   // ✅ GOOD
   interface User {
     id: string;
     email: string;
     metadata: Record<string, any>; // OK for extensibility
   }

   // ❌ BAD
   function processData(data: any) { // Never use any for parameters
     // ...
   }
   ```

4. **Proper Error Handling**
   ```typescript
   class EngineError extends Error {
     constructor(
       message: string,
       public readonly code: string,
       public readonly details?: Record<string, any>
     ) {
       super(message);
       this.name = 'EngineError';
     }
   }

   // Usage
   throw new EngineError(
     'User not found',
     'USER_NOT_FOUND',
     { userId: '123' }
   );
   ```

---

### Database Standards

1. **Table Naming Convention**
   - Format: `engine_name_entity`
   - Example: `identity_users`, `vault_files`, `charter_consents`

2. **Column Standards**
   ```sql
   -- All tables MUST have:
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

   -- Optional but recommended:
   created_by UUID REFERENCES identity_users(id),
   metadata JSONB DEFAULT '{}'::jsonb
   ```

3. **Index Strategy**
   ```sql
   -- Foreign keys
   CREATE INDEX idx_table_name_foreign_key ON table_name(foreign_key_id);

   -- Frequently queried columns
   CREATE INDEX idx_table_name_status ON table_name(status);

   -- Composite indexes for common queries
   CREATE INDEX idx_table_name_user_created
     ON table_name(user_id, created_at DESC);
   ```

4. **RLS Policy Naming**
   - Format: `{table_name}_{operation}_{role/condition}`
   - Example: `identity_users_select_own`, `vault_files_insert_authenticated`

---

### Documentation Standards

Each engine MUST have:

1. **README.md** with:
   - Purpose and overview
   - Architecture diagram
   - Installation instructions
   - Quick start example
   - API reference
   - Event catalog (emits/listens)
   - Configuration options
   - Examples

2. **Inline Code Documentation**
   ```typescript
   /**
    * Creates a new user in the identity system.
    *
    * Emits: identity.user.created
    *
    * @param email - User email address (must be unique)
    * @param metadata - Additional user data
    * @returns Created user object
    * @throws {EngineError} USER_ALREADY_EXISTS if email taken
    */
   async createUser(
     email: string,
     metadata?: Record<string, any>
   ): Promise<User> {
     // ...
   }
   ```

3. **Database Schema Documentation**
   - Each migration file has header comments
   - Each table has purpose comment
   - Each column has description

---

## 6. Database Migration Strategy

### Migration File Template

```sql
-- Migration: YYYYMMDDHHMMSS_engine_name_description.sql
-- Engine: EngineNameEngine
-- Purpose: Brief description of what this migration does
-- Dependencies: List any required prior migrations

-- =============================================================================
-- TABLES
-- =============================================================================

-- Table: engine_name_entity
-- Purpose: Brief description
CREATE TABLE IF NOT EXISTS engine_name_entity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,

  -- Data columns
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_engine_name_entity_status
    CHECK (status IN ('active', 'inactive', 'deleted'))
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_engine_name_entity_user_id
  ON engine_name_entity(user_id);

CREATE INDEX idx_engine_name_entity_status
  ON engine_name_entity(status)
  WHERE status != 'deleted';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE engine_name_entity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "engine_name_entity_select_own"
  ON engine_name_entity FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own data
CREATE POLICY "engine_name_entity_insert_own"
  ON engine_name_entity FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own data
CREATE POLICY "engine_name_entity_update_own"
  ON engine_name_entity FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Admins have full access
CREATE POLICY "engine_name_entity_admin_all"
  ON engine_name_entity FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM identity_user_roles
      WHERE user_id = auth.uid() AND role_name = 'admin'
    )
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION engine_name_entity_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_engine_name_entity_updated_at
  BEFORE UPDATE ON engine_name_entity
  FOR EACH ROW
  EXECUTE FUNCTION engine_name_entity_updated_at();

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON engine_name_entity TO authenticated;
GRANT SELECT ON engine_name_entity TO anon;
```

### Migration Order

1. **20251221120000_identity_engine_foundation.sql** - Users, roles, teams
2. **20251221120001_config_engine_foundation.sql** - Feature flags, configs
3. **20251221120002_vault_engine_foundation.sql** - File storage
4. **20251221120003_content_engine_foundation.sql** - CMS
5. **20251221120004_comms_engine_foundation.sql** - Messaging
6. **20251221120005_subscription_engine_foundation.sql** - Subscriptions
7. **20251221120006_paywall_engine_foundation.sql** - Payments
8. **20251221120007_journeys_engine_foundation.sql** - User flows
9. **20251221120008_charter_engine_foundation.sql** - Legal compliance
10. **20251221120009_ethos_engine_foundation.sql** - Ethical AI
11. **20251221120010_admin_engine_foundation.sql** - System management
12. **20251221120011_execution_engine_foundation.sql** - Build orchestration
13. **20251221120012_testing_engine_foundation.sql** - QA automation
14. **20251221120013_compass_engine_foundation.sql** - Product discovery
15. **20251221120014_notifications_engine_foundation.sql** - Notifications

---

## 7. Testing & Validation Approach

### Validation Steps (Per Engine)

1. **TypeScript Compilation**
   ```bash
   pnpm --filter @qbos/ENGINE-NAME-core typecheck
   ```

2. **Build Success**
   ```bash
   pnpm --filter @qbos/ENGINE-NAME-core build
   ```

3. **Migration Validation**
   ```bash
   # Dry run migration
   pnpm db:migrate -- --dry-run

   # Apply migration
   pnpm db:migrate
   ```

4. **API Contract Testing**
   - Each engine exports expected types
   - Each public method has proper signature
   - Events emit with correct payload structure

### Full Build Validation

```bash
# Install all dependencies
pnpm install

# Type check entire workspace
pnpm typecheck

# Build entire workspace
pnpm build

# Run all migrations
pnpm db:migrate

# Validate migration rollback works
pnpm db:reset && pnpm db:migrate
```

---

## 8. Risk Assessment

### High Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database migration conflicts | High | Use timestamp-based naming, test rollback |
| Circular dependencies between engines | High | Enforce dependency graph, event-driven communication |
| RLS policy gaps | High | Use standardized templates, test with different user roles |
| Type errors in strict mode | Medium | Write types first, validate incrementally |
| Build cascade failures | Medium | Test each engine independently before workspace build |

### Mitigation Strategies

1. **Incremental Validation**
   - Build and validate each engine immediately after implementation
   - Don't move to next engine until current one passes all checks

2. **Dependency Isolation**
   - Engines communicate via events, not direct imports
   - Shared types go through explicit exports

3. **Database Testing**
   - Test each migration in isolation
   - Test migration + rollback
   - Validate RLS policies with test users

---

## 9. Success Criteria

### Per-Engine Success Criteria

- ✅ TypeScript compiles with no errors (strict mode)
- ✅ Package builds successfully
- ✅ Database migration runs without errors
- ✅ RLS policies enforce expected access control
- ✅ All public APIs have type definitions
- ✅ README.md documents all features
- ✅ Events are properly emitted/subscribed
- ✅ No circular dependencies
- ✅ No TODOs or placeholders in code

### Overall Success Criteria

- ✅ All 18 engines implemented and working
- ✅ `pnpm install` succeeds
- ✅ `pnpm typecheck` passes (entire workspace)
- ✅ `pnpm build` succeeds (entire workspace)
- ✅ All database migrations apply successfully
- ✅ `docs/ENGINES.md` comprehensively documents all engines
- ✅ Each engine has complete README
- ✅ PR description created with validation steps
- ✅ Code committed and pushed to branch
- ✅ Zero placeholders or TODOs in entire codebase

---

## Implementation Checklist

### Pre-Implementation
- [x] Verify existing engine structure
- [x] Review user specifications
- [x] Create implementation plan document
- [ ] Review and validate plan
- [ ] Create new git branch

### Phase 1: Core Infrastructure
- [ ] Implement IdentityEngine (users, roles, teams, sessions)
- [ ] Implement ConfigEngine (feature flags, A/B tests)
- [ ] Enhance SafetyEngine (extend existing implementation)
- [ ] Create database migrations for Phase 1
- [ ] Validate Phase 1 builds

### Phase 2: Content & Storage
- [ ] Implement VaultEngine (file storage)
- [ ] Implement ContentEngine (CMS)
- [ ] Implement CommsEngine (messaging)
- [ ] Create database migrations for Phase 2
- [ ] Validate Phase 2 builds

### Phase 3: Business
- [ ] Implement SubscriptionEngine
- [ ] Implement PaywallEngine
- [ ] Implement JourneysEngine
- [ ] Create database migrations for Phase 3
- [ ] Validate Phase 3 builds

### Phase 4: Governance
- [ ] Implement CharterEngine
- [ ] Implement EthosEngine
- [ ] Implement AdminEngine
- [ ] Create database migrations for Phase 4
- [ ] Validate Phase 4 builds

### Phase 5: Development
- [ ] Implement ExecutionEngine
- [ ] Implement TestingEngine
- [ ] Implement CompassEngine
- [ ] Implement NotificationsEngine
- [ ] Create database migrations for Phase 5
- [ ] Validate Phase 5 builds

### Final Validation
- [ ] Full workspace typecheck
- [ ] Full workspace build
- [ ] All migrations tested
- [ ] Create docs/ENGINES.md
- [ ] Create PR description
- [ ] Commit and push

---

## Next Steps

1. **Review this plan** - Ensure all architectural questions are answered
2. **Create git branch** - `claude/integrate-sightengine-aUgaT` (already exists, will use it)
3. **Start Phase 1** - Begin with IdentityEngine as foundation
4. **Iterate rapidly** - Build, validate, commit each engine

---

**Document Status:** ✅ READY FOR IMPLEMENTATION

**Estimated Timeline:** 10-12 days for all 18 engines at production quality

**Confidence Level:** HIGH - Clear architecture, proven patterns, comprehensive plan
