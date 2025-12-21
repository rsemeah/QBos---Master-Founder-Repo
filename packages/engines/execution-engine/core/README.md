# ExecutionEngine™

**Build orchestration and CI/CD for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/execution-engine-core
```

## Quick Start

```typescript
import { ExecutionEngine } from '@qbos/execution-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new ExecutionEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `execution.build.started`
- `execution.build.completed`
- `execution.deployment.completed`

## License

MIT
