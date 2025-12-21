# AdminEngine™

**System management and operations for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/admin-engine-core
```

## Quick Start

```typescript
import { AdminEngine } from '@qbos/admin-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new AdminEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `admin.user.suspended`
- `admin.feature.toggled`
- `admin.backup.created`

## License

MIT
