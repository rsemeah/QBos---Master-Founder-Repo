# ExecutionEngine™

**Interactive Build Command Center for QuietBuild OS**

ExecutionEngine™ is the orchestration layer that guides users through building applications with QBos. It provides step-by-step guidance, validates integrations, and produces deployment receipts.

---

## What ExecutionEngine Is

- **Interactive Guide**: Walks users through app setup step-by-step
- **Validation Engine**: Checks environment, database, and engine availability
- **Receipts Generator**: Produces audit-ready deployment summaries
- **Graceful Degradation**: Works even when other engines are unavailable

---

## What ExecutionEngine Is NOT

- ❌ **Not a Code Generator**: Does not write application code
- ❌ **Not a Deployer**: Does not deploy apps to production
- ❌ **Not a Package Manager**: Does not install dependencies
- ❌ **Not a UI Framework**: Backend orchestration only

---

## Core API

### `createBuildSession(params)`

Creates a new build session with specified goals.

```typescript
const result = await executionEngine.createBuildSession({
  appName: 'my-saas-app',
  goals: ['auth', 'consent', 'payments'],
  template: 'nextjs-app'
});

// Returns: { ok: true, data: BuildSession }
```

### `getNextStep(sessionId)`

Gets the next pending step for a session.

```typescript
const result = await executionEngine.getNextStep(sessionId);

// Returns: { ok: true, data: BuildStep | null }
```

### `executeStep(params)`

Executes a specific step in the build session.

```typescript
const result = await executionEngine.executeStep({
  sessionId: 'abc-123',
  stepId: 'step-456',
  input: { /* optional params */ }
});

// Returns: { ok: true, data: BuildStep }
```

### `getReceipts(sessionId)`

Generates a receipts bundle for a completed session.

```typescript
const result = await executionEngine.getReceipts(sessionId);

// Returns: { ok: true, data: ReceiptsBundle }
```

---

## BuildSession Lifecycle

1. **Create Session** → Returns session with generated steps
2. **Get Next Step** → Returns next pending step
3. **Execute Step** → Runs checks/generators, marks complete
4. **Repeat** → Continue until no pending steps remain
5. **Get Receipts** → Retrieve final deployment summary

---

## Step Types

### Check Steps (`actionType: 'check'`)

Validates environment, database, or engine availability.

**Example:**
- Check Node.js version
- Check database connection
- Verify engine availability

### Generate Steps (`actionType: 'generate'`)

Creates configuration or scaffolding.

**Example:**
- Generate app structure
- Setup engine configuration
- Create database migrations

### Confirm Steps (`actionType: 'confirm'`)

User confirmation or review steps.

**Example:**
- Review integration plan
- Confirm deployment readiness

---

## Receipts Bundle Structure

```typescript
{
  sessionId: string;
  appName: string;
  enginesUsed: string[];        // ['IdentityEngine', 'CharterEngine']
  checksPassed: string[];       // ['Check Environment', 'Check DB']
  checksFailed: string[];       // []
  totalSteps: number;           // 7
  successfulSteps: number;      // 7
  failedSteps: number;          // 0
  createdAt: string;            // ISO timestamp
  completedAt: string;          // ISO timestamp
  duration: string;             // "5m 32s"
}
```

---

## Testing via Proof Harness

### API Endpoints

```bash
# Create build session
POST /api/execution/session/create
{
  "appName": "test-app",
  "goals": ["auth", "consent"]
}

# Get next step
GET /api/execution/session/:sessionId/next

# Execute step
POST /api/execution/step/execute
{
  "sessionId": "abc-123",
  "stepId": "step-456"
}

# Get receipts
GET /api/execution/session/:sessionId/receipts
```

### UI Panel

Navigate to `/engines/execution` in the proof harness to:
- Create build sessions
- Step through build process
- View real-time progress
- Export receipts

---

## Error Handling

ExecutionEngine gracefully degrades when engines are unavailable:

```typescript
// If IdentityEngine is unavailable:
{
  ok: true,
  data: {
    ...step,
    result: {
      warning: 'IdentityEngine not available',
      suggestion: 'Install @qbos/identity-engine-core',
      fallback: 'Continuing without authentication'
    }
  }
}
```

---

## Production vs Proof Mode

### Proof Mode (In-Memory)
- Stores sessions in memory
- Simulates checks and generation
- No external dependencies required
- Perfect for demos and testing

### Production Mode (Database-Backed)
- Persists sessions to database
- Real checks against live engines
- Full validation and error handling
- Audit trail for compliance

---

## Integration with Other Engines

ExecutionEngine can orchestrate:

- ✅ **IdentityEngine**: User/org setup
- ✅ **CharterEngine**: Consent configuration
- ✅ **ConfigEngine**: Feature flag setup
- ✅ **PaywallEngine**: Entitlement configuration
- ✅ **NotificationsEngine**: Notification setup

But it **never hard-imports** other engines. Uses detection and graceful fallback.

---

## Event Emission

ExecutionEngine emits events for observability:

- `execution.session.created`
- `execution.step.started`
- `execution.step.completed`
- `execution.step.failed`
- `execution.session.completed`

---

## Example: Full Build Session

```typescript
import { ExecutionEngine } from '@qbos/execution-engine-core';

const engine = new ExecutionEngine();
await engine.init();

// 1. Create session
const session = await engine.createBuildSession({
  appName: 'saas-app',
  goals: ['auth', 'consent', 'payments']
});

// 2. Execute all steps
let nextStep = await engine.getNextStep(session.data!.id);
while (nextStep.data) {
  await engine.executeStep({
    sessionId: session.data!.id,
    stepId: nextStep.data.id
  });
  nextStep = await engine.getNextStep(session.data!.id);
}

// 3. Get receipts
const receipts = await engine.getReceipts(session.data!.id);
console.log(receipts.data);
```

---

## Status: Production-Ready ✅

- ✅ Real implementation (not stubs)
- ✅ TypeScript strict mode
- ✅ Graceful degradation
- ✅ Comprehensive error handling
- ✅ Step-by-step orchestration
- ✅ Receipts generation
- ✅ Zero hard dependencies on other engines

---

**ExecutionEngine™ makes QBos usable.** It's the command center that turns infrastructure into a guided experience.
