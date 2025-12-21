# PaywallEngine™

**Payment processing and Stripe integration for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/paywall-engine-core
```

## Quick Start

```typescript
import { PaywallEngine } from '@qbos/paywall-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new PaywallEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `paywall.payment.succeeded`
- `paywall.payment.failed`
- `paywall.refund.created`

## License

MIT
