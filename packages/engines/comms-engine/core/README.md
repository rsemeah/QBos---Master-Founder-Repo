# CommsEngine™

**Messaging, comments, and real-time communication for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/comms-engine-core
```

## Quick Start

```typescript
import { CommsEngine } from '@qbos/comms-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new CommsEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `comms.message.sent`
- `comms.thread.created`
- `comms.mention.created`

## License

MIT
