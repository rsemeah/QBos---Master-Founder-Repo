# Getting Started with QuietBuild OS

**From Zero to Production in 15 Minutes**

This guide will walk you through setting up QuietBuild OS, running your first engine, and deploying to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Run Your First Engine](#run-your-first-engine)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ ([Install](https://pnpm.io/installation))
- **Supabase Account** ([Sign up](https://supabase.com))

### Recommended

- **Git** for version control
- **VS Code** with TypeScript extensions
- **Docker** (optional, for local Postgres)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/qbos-master-founder-repo.git
cd qbos-master-founder-repo
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the monorepo using pnpm workspaces.

### 3. Build Packages

```bash
pnpm build
```

This compiles all TypeScript packages in dependency order using Turborepo.

**Expected output**:
```
• Packages in scope: @qbos/database, @qbos/events, @qbos/runtime, ...
✓ Built 8 packages in 12.3s
```

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name, password, and region
4. Wait for project creation (~2 minutes)

### 2. Get Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy:
   - `Project URL` (e.g., `https://abcdefgh.supabase.co`)
   - `anon` `public` key (starts with `eyJ...`)
   - `service_role` `secret` key (starts with `eyJ...`)

### 3. Configure Environment

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

This creates the foundational schema:
- `qbos_events` (event outbox)
- `profiles` (user profiles)
- `audit_log` (system audit trail)
- SECURITY DEFINER functions

**Expected output**:
```
🚀 QuietBuild OS - Database Migration Runner

📋 Found 1 migration(s):
   📄 000_foundations.sql
   ✅ Executed successfully

✅ All migrations completed successfully!
```

### 5. Verify Database

Check your Supabase dashboard:
1. Go to **Table Editor**
2. You should see: `qbos_events`, `profiles`, `audit_log`

---

## Run Your First Engine

Let's create a simple worker that runs SafetyEngine.

### 1. Create Worker File

```bash
mkdir -p apps/worker/src
```

Create `apps/worker/src/index.ts`:

```typescript
import { bootstrap } from '@qbos/runtime';
import { SafetyEngine, PatternModerator, DEFAULT_SAFETY_POLICY } from '@qbos/safety-engine-core';

async function main() {
  // Create moderator
  const moderator = new PatternModerator();

  // Create engine
  const safetyEngine = new SafetyEngine();

  // Bootstrap QuietBuild OS
  const qbos = await bootstrap(
    {
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      environment: 'development',
      useInMemoryEventBus: true, // Use in-memory for testing
      engineConfigs: {
        'safety-engine': {
          enabled: true,
          config: {
            moderators: [moderator],
            policies: [DEFAULT_SAFETY_POLICY],
            defaultPolicy: DEFAULT_SAFETY_POLICY,
            enableReputationTracking: true,
          },
        },
      },
    },
    [safetyEngine]
  );

  // Start the system
  await qbos.start();

  // Test: Emit a content event
  console.log('\n🧪 Testing content moderation...\n');

  qbos.eventBus.on('safety.*', async (event) => {
    console.log(`📬 Safety event: ${event.name}`);
    console.log(`   Decision: ${event.payload.decision}`);
    console.log(`   Violations: ${event.payload.violations?.length || 0}\n`);
  });

  await qbos.eventBus.emit('test.content.created', {
    content: 'Hello world! This is a safe message.',
    contentType: 'text',
    userId: 'test-user',
    resourceId: 'test-post-1',
  });

  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ Test complete! SafetyEngine is working.\n');
}

main().catch(console.error);
```

### 2. Create Worker Package

Create `apps/worker/package.json`:

```json
{
  "name": "@qbos/worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@qbos/runtime": "workspace:*",
    "@qbos/safety-engine-core": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

Create `apps/worker/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### 3. Run the Worker

```bash
cd apps/worker
pnpm install
pnpm dev
```

**Expected output**:
```
🎯 QuietBuild OS - Bootstrap
   Environment: development
   Event Bus: In-Memory
   Engines: 1

✅ Supabase client created
✅ Event bus created
✅ Engine registry created
📦 Registered engine: SafetyEngine™ (safety-engine)

🚀 Initializing QuietBuild OS engines...
   🛡️  Registered moderator: pattern-moderator
   📋 Loaded 1 safety policies
✅ SafetyEngine™ initialized

🚀 Starting all engines...
🚀 SafetyEngine™ started

✅ QuietBuild OS is running!

🧪 Testing content moderation...

📬 Safety event: safety.content.approved
   Decision: approved
   Violations: 0

✅ Test complete! SafetyEngine is working.
```

---

## Development Workflow

### Project Structure

```
qbos-master-founder-repo/
├── packages/
│   ├── database/          # Database migrations and types
│   ├── events/            # Event bus implementations
│   ├── runtime/           # Engine orchestration
│   └── engines/
│       ├── silent-engine/ # AI routing (COMPLETE)
│       ├── sight-engine/  # Visual quality (COMPLETE)
│       └── safety-engine/ # Content moderation (COMPLETE)
├── apps/
│   └── worker/            # Worker process (you created this)
├── docs/                  # Documentation
├── .env                   # Environment variables
├── package.json           # Root package
├── pnpm-workspace.yaml    # Workspace config
└── turbo.json             # Turborepo config
```

### Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run database migrations
pnpm db:migrate

# Reset database (⚠️ DESTRUCTIVE)
pnpm db:reset

# Build specific package
pnpm --filter @qbos/events build

# Run worker in development
cd apps/worker && pnpm dev
```

### Adding a New Engine

See `docs/ENGINE_IMPLEMENTATION_GUIDE.md` for step-by-step instructions.

### Testing Events

Use the in-memory event bus for testing:

```typescript
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();

// Emit event
await eventBus.emit('test.event', { foo: 'bar' });

// Check history
const events = eventBus.getAllEvents();
console.log(events); // [{ id, name, payload, ... }]

// Clear for next test
eventBus.clear();
```

---

## Production Deployment

### 1. Environment Setup

Create production `.env`:

```bash
# Supabase (use production project)
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# Environment
NODE_ENV=production

# Worker config
WORKER_ID=worker-1
EVENT_BUS_POLL_INTERVAL=1000
```

### 2. Run Migrations

```bash
NODE_ENV=production pnpm db:migrate
```

### 3. Build for Production

```bash
pnpm build
```

### 4. Deploy Worker

**Option A: Render**

1. Create new Web Service
2. Build command: `pnpm install && pnpm build`
3. Start command: `node apps/worker/dist/index.js`
4. Add environment variables
5. Deploy

**Option B: Railway**

```bash
railway login
railway init
railway up
```

**Option C: Docker**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.12.0

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm build

# Start worker
CMD ["node", "apps/worker/dist/index.js"]
```

Build and run:
```bash
docker build -t qbos-worker .
docker run --env-file .env qbos-worker
```

### 5. Monitor

Check worker health:

```bash
# Add health endpoint to worker
app.get('/health', async (req, res) => {
  const health = await qbos.healthCheck();
  res.json({ healthy: Object.values(health).every(h => h) });
});
```

Monitor events:

```sql
-- Pending events
SELECT COUNT(*) FROM qbos_events WHERE status = 'pending';

-- Failed events
SELECT * FROM qbos_events WHERE status = 'failed' ORDER BY created_at DESC;

-- Event throughput
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  status,
  COUNT(*)
FROM qbos_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour, status
ORDER BY hour DESC;
```

---

## Troubleshooting

### "Missing environment variables"

**Problem**: `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` not set

**Solution**:
```bash
# Check .env file exists
cat .env

# Verify values are set
echo $SUPABASE_URL

# If empty, source .env
set -a && source .env && set +a
```

### "Migration failed: relation already exists"

**Problem**: Trying to run migrations twice

**Solution**:
```bash
# Reset database (⚠️ destroys all data)
pnpm db:reset
```

### "No moderator available for content type"

**Problem**: SafetyEngine not configured with moderators

**Solution**:
```typescript
import { PatternModerator } from '@qbos/safety-engine-core';

const moderator = new PatternModerator();

// Add to engine config
engineConfigs: {
  'safety-engine': {
    config: {
      moderators: [moderator], // ✅ Add this
      // ...
    }
  }
}
```

### "RPC function not found"

**Problem**: Database functions not created

**Solution**:
```bash
# Re-run migrations
pnpm db:migrate

# Verify functions exist in Supabase dashboard
# Database → Functions → should see:
# - insert_qbos_event
# - fetch_and_lock_events
# - mark_event_processed
# - mark_event_failed
```

### Events not processing

**Problem**: Worker not polling or events stuck

**Solution**:
```typescript
// Check if using DatabaseEventBus
useInMemoryEventBus: false, // ✅ Use database bus

// Increase poll frequency
eventBusPollInterval: 500, // Poll every 500ms

// Check database for stuck events
SELECT * FROM qbos_events WHERE status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes';
```

---

## Next Steps

1. **Read Architecture**: `docs/ARCHITECTURE.md`
2. **Implement Your First Engine**: `docs/ENGINE_IMPLEMENTATION_GUIDE.md`
3. **Deploy to Production**: Follow deployment section above
4. **Add More Engines**: IdentityEngine, PaywallEngine, etc.
5. **Build Your App**: Integrate with Next.js, React, or any framework

---

## Getting Help

- **Documentation**: `docs/` folder
- **Examples**: `apps/worker/src/index.ts`
- **SafetyEngine Guide**: `packages/engines/safety-engine/README.md`
- **Issues**: Open an issue on GitHub

---

**Welcome to QuietBuild OS!** 🎯

You're now ready to build production-grade applications with a world-class foundation.
