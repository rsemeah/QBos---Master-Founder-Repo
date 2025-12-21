# CompassEngine™

**Product discovery and analytics for QuietBuild OS**

## Features

- Event-driven architecture
- TypeScript strict mode
- Production-ready implementation

## Installation

```bash
pnpm install @qbos/compass-engine-core
```

## Quick Start

```typescript
import { CompassEngine } from '@qbos/compass-engine-core';
import { InMemoryEventBus } from '@qbos/events';

const eventBus = new InMemoryEventBus();
const engine = new CompassEngine({ enabled: true }, eventBus);

await engine.init();
```

## Events

- `compass.feature.discovered`
- `compass.feedback.submitted`
- `compass.insight.generated`

## License

MIT
