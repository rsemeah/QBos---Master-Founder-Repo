# QuietBuild OS - Engine Documentation

**Complete 18-Engine Suite**

QuietBuild OS is built on 18 specialized engines that provide comprehensive product operating system capabilities. Each engine is production-ready, event-driven, and product-agnostic.

---

## Engine Architecture

All engines follow a consistent architecture:
- **TypeScript Strict Mode** - Complete type safety
- **Event-Driven** - Loose coupling via event bus
- **Product-Agnostic** - Generic capabilities, not product-specific
- **Database-Backed** - PostgreSQL with Row Level Security
- **Health Checks** - init(), shutdown(), healthCheck() lifecycle

---

## Complete Engine Suite (18 Engines)

### Core Infrastructure Engines

#### 1. **IdentityEngine™**
**Package:** `@qbos/identity-engine-core`
**Purpose:** Identity and access management

**Capabilities:**
- User management (CRUD, authentication)
- Role-based access control (RBAC)
- Team/organization management
- Session lifecycle management
- Permission checking

**Events:** `identity.user.*`, `identity.role.*`, `identity.team.*`, `identity.session.*`

---

#### 2. **ConfigEngine™**
**Package:** `@qbos/config-engine-core`
**Purpose:** Feature flags and configuration management

**Capabilities:**
- Feature flag management with targeting
- A/B testing with variant assignment
- Configuration key-value store
- Rollout percentages
- Caching layer

**Events:** `config.flag.*`, `config.abtest.*`, `config.config.*`

---

#### 3. **SafetyEngine™**
**Package:** `@qbos/safety-engine-core`
**Purpose:** Content moderation and user safety

**Capabilities:**
- Multi-modal content moderation
- Policy enforcement
- User reputation management
- Pattern-based and AI-powered moderation
- Event-driven safety checks

**Events:** `safety.content.*`, `safety.reputation.*`, `safety.user.*`

---

### Communication Engines

#### 4. **NotificationsEngine™**
**Package:** `@qbos/notifications-engine-core`
**Purpose:** Multi-channel notification delivery

**Capabilities:**
- Email notifications (SendGrid, SES, Mailgun)
- SMS notifications (Twilio, Vonage)
- Push notifications (FCM, APNS)
- Webhook notifications
- Template management
- Delivery tracking and retry logic

**Events:** `notifications.email.sent`, `notifications.sms.sent`, `notifications.push.sent`

---

#### 5. **CommsEngine™**
**Package:** `@qbos/comms-engine-core`
**Purpose:** Messaging and real-time communication

**Capabilities:**
- Messaging and threads
- Comments systems
- @mentions
- Real-time communication
- Message reactions
- Moderation integration

**Events:** `comms.message.sent`, `comms.thread.created`, `comms.mention.created`

---

### Storage & Content Engines

#### 6. **VaultEngine™**
**Package:** `@qbos/vault-engine-core`
**Purpose:** File storage and CDN integration

**Capabilities:**
- File upload/download/delete
- Multi-provider storage (S3, GCS, Azure, Supabase)
- Signed URL generation
- CDN integration (CloudFlare, CloudFront, Fastly)
- File permissions and access control
- Metadata tracking

**Events:** `vault.file.uploaded`, `vault.file.downloaded`, `vault.file.deleted`

---

#### 7. **ContentEngine™**
**Package:** `@qbos/content-engine-core`
**Purpose:** CMS and content versioning

**Capabilities:**
- Content CRUD operations
- Content versioning with history
- Draft/published workflow
- Custom content types
- Rich metadata and SEO
- Media attachments
- Multi-language support

**Events:** `content.created`, `content.updated`, `content.published`, `content.deleted`

---

### Business & Monetization Engines

#### 8. **SubscriptionEngine™**
**Package:** `@qbos/subscription-engine-core`
**Purpose:** Billing cycles and subscription management

**Capabilities:**
- Subscription lifecycle management
- Subscription plans
- Billing cycle tracking
- Usage metering
- Trial periods
- Upgrades/downgrades

**Events:** `subscription.created`, `subscription.updated`, `subscription.cancelled`

---

#### 9. **PaywallEngine™**
**Package:** `@qbos/paywall-engine-core`
**Purpose:** Payment processing and Stripe integration

**Capabilities:**
- Payment processing
- Stripe integration
- Payment methods management
- Invoicing
- Refunds
- Revenue tracking

**Events:** `paywall.payment.succeeded`, `paywall.payment.failed`, `paywall.refund.created`

---

### Governance & Compliance Engines

#### 10. **CharterEngine™**
**Package:** `@qbos/charter-engine-core`
**Purpose:** Legal compliance and consent management

**Capabilities:**
- GDPR compliance (consent, data export/deletion)
- Terms of Service management
- Privacy Policy management
- Cookie consent tracking
- Data retention policies
- Comprehensive audit logging

**Events:** `charter.consent.accepted`, `charter.data.exported`, `charter.data.deleted`

---

#### 11. **EthosEngine™**
**Package:** `@qbos/ethos-engine-core`
**Purpose:** Ethical AI and bias detection

**Capabilities:**
- Bias detection in AI outputs
- Toxicity screening
- Fairness metrics
- AI decision auditing
- Ethical guidelines enforcement

**Events:** `ethos.bias.detected`, `ethos.toxicity.detected`, `ethos.audit.completed`

---

#### 12. **AdminEngine™**
**Package:** `@qbos/admin-engine-core`
**Purpose:** System management and operations

**Capabilities:**
- System health monitoring
- User management admin tools
- Feature flag administration
- Database operations
- Audit log viewing
- System metrics

**Events:** `admin.user.suspended`, `admin.feature.toggled`, `admin.backup.created`

---

### AI & Intelligence Engines

#### 13. **SilentEngine™**
**Package:** `@qbos/silent-engine-core`
**Purpose:** Intelligent AI routing

**Capabilities:**
- Multi-provider AI routing
- LLM abstraction layer
- Provider failover
- Cost optimization
- Latency tracking

**Events:** `silent.request.*`, `silent.response.*`

---

#### 14. **SightEngine™**
**Package:** `@qbos/sight-engine`
**Purpose:** Visual quality standards

**Capabilities:**
- Visual validation
- Quality standards enforcement
- Image analysis
- UI/UX consistency checking

**Events:** `sight.validation.*`

---

### User Experience Engines

#### 15. **JourneysEngine™**
**Package:** `@qbos/journeys-engine-core`
**Purpose:** User flows and onboarding

**Capabilities:**
- Journey definitions
- User progress tracking
- Step completion tracking
- Branching logic
- Journey analytics

**Events:** `journeys.started`, `journeys.step.completed`, `journeys.completed`

---

### Development & Testing Engines

#### 16. **ExecutionEngine™**
**Package:** `@qbos/execution-engine-core`
**Purpose:** Build orchestration and CI/CD

**Capabilities:**
- Build pipeline management
- Job orchestration
- Artifact management
- Environment management
- Deployment tracking

**Events:** `execution.build.started`, `execution.build.completed`, `execution.deployment.completed`

---

#### 17. **TestingEngine™**
**Package:** `@qbos/testing-engine-core`
**Purpose:** QA automation and test orchestration

**Capabilities:**
- Test suite management
- Test execution orchestration
- Coverage tracking
- Visual regression testing
- Test result aggregation

**Events:** `testing.suite.started`, `testing.test.passed`, `testing.test.failed`

---

### Product Intelligence Engines

#### 18. **CompassEngine™**
**Package:** `@qbos/compass-engine-core`
**Purpose:** Product discovery and analytics

**Capabilities:**
- Feature discovery
- Feature usage analytics
- User feedback collection
- Feature voting
- Roadmap management
- Product insights

**Events:** `compass.feature.discovered`, `compass.feedback.submitted`, `compass.insight.generated`

---

## Installation

Install any engine via pnpm:

```bash
pnpm install @qbos/ENGINENAME-core
```

For example:
```bash
pnpm install @qbos/identity-engine-core
pnpm install @qbos/config-engine-core
pnpm install @qbos/notifications-engine-core
```

---

## Usage Pattern

All engines follow a consistent usage pattern:

```typescript
import { EngineClass } from '@qbos/engine-name-core';
import { InMemoryEventBus } from '@qbos/events';

// Create event bus
const eventBus = new InMemoryEventBus();

// Initialize engine
const engine = new EngineClass({
  enabled: true,
  // ... engine-specific config
}, eventBus);

// Initialize
await engine.init();

// Use engine methods
const result = await engine.someMethod();

// Shutdown when done
await engine.shutdown();
```

---

## Event-Driven Architecture

All engines communicate via events:

```typescript
// Engine A emits event
await eventBus.emit('identity.user.created', {
  userId: 'user_123',
  email: 'user@example.com',
  timestamp: new Date().toISOString()
});

// Engine B subscribes
eventBus.on('identity.user.created', async (event) => {
  // React to user creation
  await notificationsEngine.sendWelcomeEmail(event.email);
  await journeysEngine.startOnboarding(event.userId);
});
```

---

## Database Schema

Each engine that requires database storage has:
- Complete migration files in `packages/database/supabase/migrations/`
- Row Level Security (RLS) policies
- Proper indexes for performance
- Audit trails where needed

See individual engine `supabase/README.md` files for complete schema documentation.

---

## Development

### Building All Engines

```bash
pnpm install
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Testing Individual Engines

```bash
pnpm --filter @qbos/ENGINE-NAME-core build
pnpm --filter @qbos/ENGINE-NAME-core typecheck
```

---

## Architecture Principles

1. **Product-Agnostic** - Engines provide generic capabilities, not product-specific features
2. **Event-Driven** - Loose coupling via events, not direct dependencies
3. **Type-Safe** - Complete TypeScript coverage with strict mode
4. **Database-First** - PostgreSQL with RLS for security
5. **Provider-Agnostic** - Abstract external services (storage, email, etc.)
6. **Graceful Degradation** - Engines work independently, failures don't cascade
7. **Audit-Ready** - Comprehensive logging and event tracking

---

## Performance

- **Caching** - ConfigEngine provides built-in caching
- **Non-Blocking** - Event emissions use `setImmediate()` for non-blocking operations
- **Database Optimized** - Proper indexes on all frequently queried columns
- **Connection Pooling** - PostgreSQL connection pooling for scalability

---

## Security

- **Row Level Security (RLS)** - Database-level security enforcement
- **SECURITY DEFINER Functions** - Controlled privileged operations
- **Permission Checks** - IdentityEngine provides comprehensive RBAC
- **Audit Logging** - All critical operations logged
- **Secret Management** - ConfigEngine supports secret configuration

---

## Contributing

See main QuietBuild OS repository for contribution guidelines.

---

## License

MIT

---

**QuietBuild OS** - The Product Operating System
18 engines, production-ready, event-driven, product-agnostic.
