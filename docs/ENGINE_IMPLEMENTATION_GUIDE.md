# Engine Implementation Guide

**Build Your Own QuietBuild OS Engine in 30 Minutes**

This guide shows you how to implement a complete QuietBuild OS engine using SafetyEngine™ as a reference template.

---

## Table of Contents

1. [Overview](#overview)
2. [Engine Anatomy](#engine-anatomy)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Example: IdentityEngine](#example-identityengine)
5. [Testing Your Engine](#testing-your-engine)
6. [Best Practices](#best-practices)
7. [Remaining Engines](#remaining-engines)

---

## Overview

Every QuietBuild OS engine follows the same pattern:

1. **Extend BaseEngine** from `@qbos/runtime`
2. **Define Types** for your domain
3. **Implement Lifecycle Hooks** (initialize, start, stop, healthCheck)
4. **Subscribe to Events** from other engines
5. **Emit Events** when your engine does work
6. **Export Everything** from index.ts

---

## Engine Anatomy

### Minimal Engine Structure

```
packages/engines/my-engine/
├── core/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── types.ts              # Domain types
│       ├── my-engine.ts          # Main engine class
│       └── index.ts              # Public exports
└── README.md
```

### Core Files

#### 1. `package.json`

```json
{
  "name": "@qbos/my-engine-core",
  "version": "1.0.0",
  "description": "MyEngine™ - Purpose of your engine",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@qbos/runtime": "workspace:*",
    "@qbos/events": "workspace:*",
    "@qbos/database": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0"
  }
}
```

#### 2. `tsconfig.json`

```json
{
  "extends": "../../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [
    { "path": "../../../runtime" },
    { "path": "../../../events" },
    { "path": "../../../database" }
  ]
}
```

#### 3. `src/types.ts`

```typescript
/**
 * MyEngine™ Types
 */

// Define your domain types
export interface MyResource {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Define events your engine emits
export const MY_EVENTS = {
  RESOURCE_CREATED: 'my-engine.resource.created',
  RESOURCE_UPDATED: 'my-engine.resource.updated',
  RESOURCE_DELETED: 'my-engine.resource.deleted',
} as const;

export type MyEventName = typeof MY_EVENTS[keyof typeof MY_EVENTS];
```

#### 4. `src/my-engine.ts`

```typescript
import { BaseEngine, EngineMetadata } from '@qbos/runtime';
import { Event } from '@qbos/events';
import { MY_EVENTS } from './types';

export interface MyEngineConfig {
  // Engine-specific configuration
  enableFeatureX?: boolean;
  apiKey?: string;
}

export class MyEngine extends BaseEngine {
  readonly metadata: EngineMetadata = {
    id: 'my-engine',
    name: 'MyEngine™',
    version: '1.0.0',
    description: 'Purpose of your engine',
    capabilities: ['feature_x', 'feature_y'],
    dependencies: [], // Other engines this depends on
  };

  protected async onInitialize(): Promise<void> {
    const config = this.context.config.config as MyEngineConfig;

    // Subscribe to events from other engines
    this.on('user.created', this.handleUserCreated.bind(this));

    console.log(`   ⚙️  MyEngine initialized with config:`, config);
  }

  protected async onStart(): Promise<void> {
    // Start background tasks, connections, etc.
    console.log('   🚀 MyEngine started');
  }

  protected async onStop(): Promise<void> {
    // Cleanup resources
    console.log('   🛑 MyEngine stopped');
  }

  protected async onHealthCheck(): Promise<boolean> {
    // Check if engine is healthy
    return true;
  }

  /**
   * Event handlers
   */
  private async handleUserCreated(event: Event): Promise<void> {
    const { userId } = event.payload;

    // Do something when user is created
    await this.emit(MY_EVENTS.RESOURCE_CREATED, {
      resourceId: `resource_${userId}`,
      userId,
    });
  }

  /**
   * Public API methods (optional)
   */
  async createResource(name: string): Promise<string> {
    const resourceId = `resource_${Date.now()}`;

    await this.emit(MY_EVENTS.RESOURCE_CREATED, {
      resourceId,
      name,
    });

    return resourceId;
  }
}
```

#### 5. `src/index.ts`

```typescript
/**
 * @qbos/my-engine-core - MyEngine™ Core Package
 *
 * Purpose of your engine.
 */

// Export types
export * from './types';

// Export engine
export { MyEngine, MyEngineConfig } from './my-engine';
```

---

## Step-by-Step Implementation

### Step 1: Create Package Structure

```bash
mkdir -p packages/engines/my-engine/core/src
cd packages/engines/my-engine
```

### Step 2: Copy Package Files

Copy `package.json` and `tsconfig.json` from SafetyEngine:

```bash
cp ../safety-engine/core/package.json core/package.json
cp ../safety-engine/core/tsconfig.json core/tsconfig.json
```

Edit `core/package.json`:
- Change `name` to `@qbos/my-engine-core`
- Update `description`

### Step 3: Define Types

Create `core/src/types.ts` with your domain types and events.

**Template**:
```typescript
export const MY_ENGINE_EVENTS = {
  // Define events your engine emits
  THING_HAPPENED: 'my-engine.thing.happened',
} as const;

export interface MyThing {
  // Define your domain types
  id: string;
  name: string;
}
```

### Step 4: Implement Engine Class

Create `core/src/my-engine.ts` extending `BaseEngine`.

**Template**:
```typescript
import { BaseEngine, EngineMetadata } from '@qbos/runtime';

export class MyEngine extends BaseEngine {
  readonly metadata: EngineMetadata = {
    id: 'my-engine',
    name: 'MyEngine™',
    version: '1.0.0',
    description: 'What your engine does',
  };

  protected async onInitialize(): Promise<void> {
    // Subscribe to events
    this.on('*.event.pattern', this.handleEvent.bind(this));
  }

  protected async onStart(): Promise<void> {
    // Start processing
  }

  protected async onStop(): Promise<void> {
    // Cleanup
  }

  protected async onHealthCheck(): Promise<boolean> {
    return true;
  }

  private async handleEvent(event: Event): Promise<void> {
    // Handle events from other engines
  }
}
```

### Step 5: Create Index

Create `core/src/index.ts`:

```typescript
export * from './types';
export { MyEngine } from './my-engine';
```

### Step 6: Build

```bash
cd core
pnpm install
pnpm build
```

### Step 7: Register Engine

Add to your worker:

```typescript
import { MyEngine } from '@qbos/my-engine-core';

const qbos = await bootstrap(config, [
  new MyEngine(),
  // ... other engines
]);
```

---

## Example: IdentityEngine

Let's implement IdentityEngine™ for authentication and RBAC.

### Types (`core/src/types.ts`)

```typescript
export const IDENTITY_EVENTS = {
  USER_CREATED: 'identity.user.created',
  USER_LOGIN: 'identity.user.login',
  USER_LOGOUT: 'identity.user.logout',
  ROLE_ASSIGNED: 'identity.role.assigned',
  PERMISSION_GRANTED: 'identity.permission.granted',
} as const;

export type Role = 'admin' | 'user' | 'moderator';

export interface UserRole {
  userId: string;
  role: Role;
  assignedAt: string;
  assignedBy?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}
```

### Engine (`core/src/identity-engine.ts`)

```typescript
import { BaseEngine, EngineMetadata } from '@qbos/runtime';
import { Event } from '@qbos/events';
import { IDENTITY_EVENTS, Role } from './types';

export interface IdentityEngineConfig {
  enableMFA?: boolean;
  sessionTimeout?: number;
}

export class IdentityEngine extends BaseEngine {
  readonly metadata: EngineMetadata = {
    id: 'identity-engine',
    name: 'IdentityEngine™',
    version: '1.0.0',
    description: 'Authentication and authorization',
    capabilities: ['auth', 'rbac', 'mfa'],
  };

  private roles: Map<string, Role[]> = new Map();

  protected async onInitialize(): Promise<void> {
    const config = this.context.config.config as IdentityEngineConfig;

    // Subscribe to Supabase auth events
    this.on('auth.user.created', this.handleUserCreated.bind(this));
    this.on('auth.user.login', this.handleUserLogin.bind(this));

    console.log(`   🔐 IdentityEngine initialized (MFA: ${config.enableMFA})`);
  }

  protected async onStart(): Promise<void> {
    // Load roles from database
    await this.loadRoles();
  }

  protected async onStop(): Promise<void> {
    // Cleanup
  }

  protected async onHealthCheck(): Promise<boolean> {
    return true;
  }

  private async handleUserCreated(event: Event): Promise<void> {
    const { userId, email } = event.payload;

    // Assign default role
    await this.assignRole(userId, 'user');

    // Emit identity event
    await this.emit(IDENTITY_EVENTS.USER_CREATED, {
      userId,
      email,
      role: 'user',
    });
  }

  private async handleUserLogin(event: Event): Promise<void> {
    const { userId, ipAddress } = event.payload;

    await this.emit(IDENTITY_EVENTS.USER_LOGIN, {
      userId,
      ipAddress,
      timestamp: new Date().toISOString(),
    });
  }

  private async loadRoles(): Promise<void> {
    // Load roles from database
    // In production, query Supabase
    console.log('   📋 Loaded user roles');
  }

  /**
   * Public API: Assign role to user
   */
  async assignRole(userId: string, role: Role): Promise<void> {
    const userRoles = this.roles.get(userId) || [];
    if (!userRoles.includes(role)) {
      userRoles.push(role);
      this.roles.set(userId, userRoles);

      await this.emit(IDENTITY_EVENTS.ROLE_ASSIGNED, {
        userId,
        role,
        assignedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Public API: Check if user has role
   */
  hasRole(userId: string, role: Role): boolean {
    const userRoles = this.roles.get(userId) || [];
    return userRoles.includes(role);
  }

  /**
   * Public API: Check if user has permission
   */
  hasPermission(userId: string, resource: string, action: string): boolean {
    const userRoles = this.roles.get(userId) || [];

    // Admins have all permissions
    if (userRoles.includes('admin')) return true;

    // Check role-based permissions
    // In production, query database
    return false;
  }
}
```

### Usage

```typescript
import { IdentityEngine } from '@qbos/identity-engine-core';

const identityEngine = new IdentityEngine();

const qbos = await bootstrap(
  {
    // ... config
    engineConfigs: {
      'identity-engine': {
        enabled: true,
        config: {
          enableMFA: true,
          sessionTimeout: 3600,
        },
      },
    },
  },
  [identityEngine]
);

await qbos.start();

// Use engine API
const identity = qbos.registry.get('identity-engine') as IdentityEngine;
await identity.assignRole('user_123', 'moderator');
const isModerator = identity.hasRole('user_123', 'moderator'); // true
```

---

## Testing Your Engine

### Unit Tests

Create `core/src/__tests__/my-engine.test.ts`:

```typescript
import { InMemoryEventBus } from '@qbos/events';
import { MyEngine } from '../my-engine';

describe('MyEngine', () => {
  let engine: MyEngine;
  let eventBus: InMemoryEventBus;

  beforeEach(async () => {
    eventBus = new InMemoryEventBus();
    engine = new MyEngine();

    await engine.initialize({
      eventBus,
      config: { enabled: true, config: {} },
    });

    await engine.start();
  });

  afterEach(async () => {
    await engine.stop();
  });

  it('should handle events', async () => {
    const events: any[] = [];

    eventBus.on('my-engine.*', async (event) => {
      events.push(event);
    });

    await eventBus.emit('test.trigger', { data: 'test' });

    expect(events.length).toBe(1);
    expect(events[0].name).toBe('my-engine.thing.happened');
  });

  it('should pass health check', async () => {
    const isHealthy = await engine.healthCheck();
    expect(isHealthy).toBe(true);
  });
});
```

### Integration Tests

Test engine in full QuietBuild OS context:

```typescript
import { bootstrap } from '@qbos/runtime';
import { MyEngine } from '@qbos/my-engine-core';

describe('MyEngine Integration', () => {
  it('should work with other engines', async () => {
    const qbos = await bootstrap(
      {
        supabaseUrl: process.env.SUPABASE_URL!,
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        useInMemoryEventBus: true,
      },
      [new MyEngine()]
    );

    await qbos.start();

    const health = await qbos.healthCheck();
    expect(health['my-engine']).toBe(true);

    await qbos.stop();
  });
});
```

---

## Best Practices

### 1. Event Naming

Use consistent naming: `{engine}.{resource}.{action}`

```typescript
// ✅ Good
'identity.user.created'
'paywall.subscription.created'
'safety.content.rejected'

// ❌ Bad
'userCreated'
'new-subscription'
'reject_content'
```

### 2. Idempotency

Always include idempotency keys when emitting events:

```typescript
await this.emit('my-engine.thing.created', payload, {
  idempotencyKey: `my-engine:create:${resourceId}`,
});
```

### 3. Error Handling

Handle errors gracefully in event handlers:

```typescript
private async handleEvent(event: Event): Promise<void> {
  try {
    // Process event
  } catch (error) {
    console.error(`Failed to handle ${event.name}:`, error);
    // Event will be retried automatically
    throw error;
  }
}
```

### 4. Health Checks

Implement meaningful health checks:

```typescript
protected async onHealthCheck(): Promise<boolean> {
  try {
    // Check external dependencies
    await this.externalAPI.ping();
    return true;
  } catch {
    return false;
  }
}
```

### 5. Configuration

Make engines configurable:

```typescript
export interface MyEngineConfig {
  apiKey?: string;
  enableFeature?: boolean;
  timeout?: number;
}

protected async onInitialize(): Promise<void> {
  const config = this.context.config.config as MyEngineConfig;

  if (!config.apiKey) {
    throw new Error('MyEngine requires apiKey in config');
  }
}
```

### 6. Documentation

Document your engine:
- Create `README.md` (see SafetyEngine README as template)
- Add JSDoc comments to public methods
- Include usage examples

---

## Remaining Engines

Here's what's left to implement:

### PaywallEngine™ (Subscriptions & Payments)

**Events**:
- `paywall.subscription.created`
- `paywall.payment.succeeded`
- `paywall.payment.failed`

**Key Features**:
- Stripe integration
- Subscription lifecycle
- Usage-based billing
- Webhook handling

**Estimate**: 4-6 hours

### NotificationsEngine™ (Multi-Channel Messaging)

**Events**:
- Listens: `*.notification.send`
- Emits: `notifications.sent`, `notifications.failed`

**Key Features**:
- Email (Resend)
- SMS (Twilio)
- Push notifications
- Template management

**Estimate**: 3-4 hours

### CharterEngine™ (Legal Compliance)

**Events**:
- `charter.terms.accepted`
- `charter.data.export.requested`
- `charter.user.deleted`

**Key Features**:
- Terms acceptance tracking
- GDPR compliance
- Data export/deletion
- Cookie consent

**Estimate**: 3-4 hours

### ConfigEngine™ (Feature Flags)

**Events**:
- `config.flag.enabled`
- `config.flag.disabled`
- `config.experiment.started`

**Key Features**:
- Feature flags
- A/B testing
- Percentage rollouts
- User targeting

**Estimate**: 2-3 hours

---

## Next Steps

1. **Pick an engine** from the list above
2. **Follow this guide** to implement it
3. **Test thoroughly** with unit and integration tests
4. **Document** with README and examples
5. **Share** with the team!

---

**Ready to build?** Use SafetyEngine as your reference implementation and this guide as your checklist. You've got this! 🚀
