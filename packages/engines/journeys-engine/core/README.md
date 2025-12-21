# JourneysEngine™

**User flows and onboarding orchestration for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/journeys-engine-core
```

## Quick Start

```typescript
import { JourneysEngine } from '@qbos/journeys-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new JourneysEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `journeys.started`
- `journeys.step.completed`
- `journeys.completed`

## License

MIT
