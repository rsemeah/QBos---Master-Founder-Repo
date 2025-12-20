# SafetyEngine™

**Content Moderation and User Safety for QuietBuild OS**

SafetyEngine™ provides comprehensive content moderation, policy enforcement, and user reputation management. It integrates seamlessly with QuietBuild OS's event-driven architecture.

## Features

- **Multi-Modal Moderation**: Text, images, video, audio, URLs, user profiles
- **Pluggable Moderators**: Pattern-based, AI-powered (OpenAI, Perspective API)
- **Policy Engine**: Flexible, customizable safety policies
- **User Reputation**: Track user behavior and trust scores
- **Event-Driven**: Listens for content events, emits safety events
- **Production-Ready**: Built on QuietBuild OS foundation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SafetyEngine™                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Listens:                  Emits:                       │
│  • *.content.created       • safety.content.approved    │
│  • *.content.updated       • safety.content.flagged     │
│                            • safety.content.rejected    │
│                            • safety.reputation.updated  │
│                            • safety.user.banned         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Moderators:               Policies:                    │
│  • PatternModerator        • Violation detection        │
│  • OpenAIModerator         • Action enforcement         │
│  • PerspectiveAPI          • Severity thresholds        │
│  • CustomModerator         • User reputation rules      │
└─────────────────────────────────────────────────────────┘
```

## Installation

```bash
pnpm install @qbos/safety-engine-core
```

## Quick Start

### 1. Basic Setup

```typescript
import { SafetyEngine, PatternModerator, DEFAULT_SAFETY_POLICY } from '@qbos/safety-engine-core';
import { bootstrap } from '@qbos/runtime';

// Create moderators
const patternModerator = new PatternModerator();

// Create SafetyEngine
const safetyEngine = new SafetyEngine();

// Bootstrap QuietBuild OS with SafetyEngine
const qbos = await bootstrap(
  {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    engineConfigs: {
      'safety-engine': {
        enabled: true,
        config: {
          moderators: [patternModerator],
          policies: [DEFAULT_SAFETY_POLICY],
          defaultPolicy: DEFAULT_SAFETY_POLICY,
          enableReputationTracking: true,
        },
      },
    },
  },
  [safetyEngine]
);

await qbos.start();
```

### 2. Moderate Content

```typescript
// SafetyEngine automatically moderates content when events are emitted
await qbos.eventBus.emit('post.content.created', {
  content: 'User-generated content here',
  contentType: 'text',
  userId: 'user_123',
  resourceId: 'post_456',
  resourceType: 'post',
});

// SafetyEngine will:
// 1. Detect the content.created event
// 2. Run moderation checks
// 3. Emit safety.content.approved (or flagged/rejected)
// 4. Update user reputation
```

### 3. Subscribe to Safety Events

```typescript
// Listen for safety events
qbos.eventBus.on('safety.content.rejected', async (event) => {
  console.log('Content rejected:', event.payload);
  // Take action: delete content, notify user, etc.
});

qbos.eventBus.on('safety.user.banned', async (event) => {
  console.log('User banned:', event.payload.userId);
  // Disable user account
});
```

## Moderators

### PatternModerator

Simple keyword/regex-based moderation for development and basic use cases.

```typescript
import { PatternModerator } from '@qbos/safety-engine-core';

const moderator = new PatternModerator();

// Add custom pattern
moderator.addPattern({
  regex: /\b(scam|fraud)\b/i,
  violationType: 'spam',
  severity: 0.8,
  explanation: 'Potential scam detected',
});
```

### Custom Moderator

Build your own moderator by implementing the `Moderator` interface:

```typescript
import { Moderator, ModerationRequest, ModerationResult } from '@qbos/safety-engine-core';

class CustomModerator implements Moderator {
  name = 'my-custom-moderator';
  supportedTypes = ['text', 'image'];

  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    // Your moderation logic here
    return {
      requestId: request.id,
      decision: 'approved',
      confidence: 0.95,
      violations: [],
      moderator: this.name,
      processingTime: 50,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
```

## Policies

Safety policies define how violations are handled.

```typescript
import { SafetyPolicy } from '@qbos/safety-engine-core';

const strictPolicy: SafetyPolicy = {
  id: 'strict-policy',
  name: 'Strict Content Policy',
  violationTypes: ['hate_speech', 'violence', 'sexual_content'],
  autoApprovalThreshold: 0.95,
  autoRejectionThreshold: 0.6,
  maxAutoApprovalSeverity: 0.2,
  actions: [
    { type: 'notify_admin' },
    { type: 'delete' },
    { type: 'ban_user' },
  ],
};
```

## Events

### SafetyEngine Listens To:

- `*.content.created` - Any content creation event
- `*.content.updated` - Any content update event

### SafetyEngine Emits:

- `safety.content.approved` - Content passed moderation
- `safety.content.flagged` - Content needs manual review
- `safety.content.rejected` - Content violates policies
- `safety.reputation.updated` - User reputation changed
- `safety.user.banned` - User has been banned

## API Reference

### SafetyEngine

```typescript
class SafetyEngine extends BaseEngine {
  // Moderate content programmatically
  async moderateContent(request: ModerationRequest): Promise<ModerationResult>;

  // Get registered moderator
  getModerator(name: string): Moderator | undefined;

  // Get all policies
  getPolicies(): SafetyPolicy[];
}
```

### ModerationRequest

```typescript
interface ModerationRequest {
  id: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'url' | 'user_profile';
  content: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
}
```

### ModerationResult

```typescript
interface ModerationResult {
  requestId: string;
  decision: 'approved' | 'flagged' | 'rejected' | 'auto_approved' | 'pending';
  confidence: number;
  violations: Violation[];
  explanation?: string;
  moderator: string;
  processingTime: number;
  metadata?: Record<string, any>;
}
```

## Advanced Usage

### Multiple Moderators

Use multiple moderators for better coverage:

```typescript
const safetyEngine = new SafetyEngine();

await qbos.bootstrap({
  engineConfigs: {
    'safety-engine': {
      config: {
        moderators: [
          new PatternModerator(),
          new OpenAIModerator({ apiKey: process.env.OPENAI_API_KEY }),
          new PerspectiveAPIModera({ apiKey: process.env.PERSPECTIVE_API_KEY }),
        ],
        // ... rest of config
      },
    },
  },
});
```

### Reputation Tracking

Track user reputation automatically:

```typescript
// SafetyEngine emits reputation updates
qbos.eventBus.on('safety.reputation.updated', async (event) => {
  const { userId, decision } = event.payload;

  // Update user reputation in database
  // Implement auto-approval for trusted users
});
```

### Custom Policy Actions

Extend policy actions:

```typescript
const customPolicy: SafetyPolicy = {
  id: 'custom-policy',
  name: 'Custom Policy',
  violationTypes: ['spam'],
  actions: [
    {
      type: 'notify_user',
      params: {
        template: 'spam-warning',
        severity: 'low'
      }
    },
  ],
  // ... rest of policy
};
```

## Testing

SafetyEngine works with in-memory event bus for testing:

```typescript
import { InMemoryEventBus } from '@qbos/events';
import { SafetyEngine } from '@qbos/safety-engine-core';

const eventBus = new InMemoryEventBus();
const safetyEngine = new SafetyEngine();

// Initialize for testing
await safetyEngine.initialize({
  eventBus,
  config: {
    enabled: true,
    config: {
      moderators: [new PatternModerator()],
      // ... config
    },
  },
});

await safetyEngine.start();

// Test content moderation
await eventBus.emit('test.content.created', {
  content: 'Test content',
  contentType: 'text',
});
```

## Production Deployment

### Environment Variables

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: AI Moderators
OPENAI_API_KEY=sk-...
PERSPECTIVE_API_KEY=your-perspective-key
```

### Monitoring

Monitor SafetyEngine health:

```typescript
// Health check endpoint
app.get('/health/safety', async (req, res) => {
  const isHealthy = await safetyEngine.healthCheck();
  res.json({ healthy: isHealthy });
});
```

## Next Steps

- **Implement AI Moderators**: Add OpenAI or Perspective API moderators
- **Build Reputation Service**: Track user behavior over time
- **Create Admin Dashboard**: Review flagged content
- **Add Image Moderation**: Integrate SightEngine™ for visual content
- **Scale Workers**: Deploy multiple workers for high-volume moderation

## Related Engines

- **SightEngine™**: Visual quality and content validation
- **CharterEngine™**: Legal compliance and terms enforcement
- **IdentityEngine™**: User authentication and RBAC

## License

Proprietary - QuietBuild OS
