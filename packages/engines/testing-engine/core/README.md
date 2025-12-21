# TestingEngine™

**QA automation and test orchestration for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/testing-engine-core
```

## Quick Start

```typescript
import { TestingEngine } from '@qbos/testing-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new TestingEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `testing.suite.started`
- `testing.test.passed`
- `testing.test.failed`

## License

MIT
