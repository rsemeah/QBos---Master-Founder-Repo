# SubscriptionEngine™

**Billing cycles and subscription management for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/subscription-engine-core
```

## Quick Start

```typescript
import { SubscriptionEngine } from '@qbos/subscription-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new SubscriptionEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.renewed`

## License

MIT
