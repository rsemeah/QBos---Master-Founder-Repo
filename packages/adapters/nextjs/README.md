# @qbos/nextjs-adapter

Next.js API route adapters for QuietBuild OS™ engines.

## Installation

```bash
npm install @qbos/nextjs-adapter @qbos/silent-engine-core @qbos/sight-engine
```

## Features

- ✅ Type-safe API route handlers
- ✅ Built-in request validation with Zod
- ✅ Authentication support
- ✅ Streaming responses
- ✅ Error handling
- ✅ Callbacks for observability

## SilentEngine Adapters

### Basic Generation Route

```typescript
// app/api/ai/generate/route.ts
import { createSilentEngineRoute } from '@qbos/nextjs-adapter';
import { silentEngine } from '@/lib/silent-engine';

export const POST = createSilentEngineRoute({
  engine: silentEngine,
  requireAuth: true,
  getUserId: async (req) => {
    // Extract user from session/JWT
    const session = await getSession(req);
    return session?.userId || null;
  },
  onSuccess: async (result, userId) => {
    // Log successful generation
    console.log(`User ${userId} generated response with ${result.provider}`);
  },
  onError: async (error, userId) => {
    // Log errors
    console.error(`User ${userId} generation failed:`, error);
  }
});
```

### Streaming Route

```typescript
// app/api/ai/stream/route.ts
import { createSilentEngineStreamRoute } from '@qbos/nextjs-adapter';
import { silentEngine } from '@/lib/silent-engine';

export const POST = createSilentEngineStreamRoute({
  engine: silentEngine
});
```

### Client Usage

```typescript
// Client-side usage
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Explain quantum computing' }
    ],
    maxCost: 0.001,
    maxLatency: 3000,
    preferredCapabilities: ['low_cost', 'fast_latency']
  })
});

const data = await response.json();
console.log(data.data.text);
console.log('Cost:', data.data.cost);
console.log('Provider:', data.data.provider);
```

### Streaming Client Usage

```typescript
const response = await fetch('/api/ai/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Tell me a story' }]
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'metadata') {
        console.log('Provider:', data.provider);
      } else if (data.type === 'content') {
        console.log('Content:', data.text);
      } else if (data.type === 'done') {
        console.log('Cost:', data.cost);
      }
    }
  }
}
```

## SightEngine Adapters

### Validation Route

```typescript
// app/api/sight/validate/route.ts
import { createSightEngineValidateRoute } from '@qbos/nextjs-adapter';

export const POST = createSightEngineValidateRoute({
  requireAuth: true,
  getUserId: async (req) => {
    const session = await getSession(req);
    return session?.userId || null;
  },
  onValidation: async (result, userId) => {
    // Log validation results
    console.log(`User ${userId} validated asset: ${result.passed}`);
  }
});
```

### Prompt Generation Route

```typescript
// app/api/sight/prompt/route.ts
import { createSightEnginePromptRoute } from '@qbos/nextjs-adapter';

export const POST = createSightEnginePromptRoute();
```

### Validate and Suggest Route

```typescript
// app/api/sight/validate-and-suggest/route.ts
import { createSightEngineValidateAndSuggestRoute } from '@qbos/nextjs-adapter';

export const POST = createSightEngineValidateAndSuggestRoute();
```

### Client Usage

```typescript
// Validate an asset
const response = await fetch('/api/sight/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assetSpec: {
      resolutionWidth: 3840,
      resolutionHeight: 2160,
      cameraModel: 'ARRI Alexa 65',
      lensType: 'Prime 65mm',
      aperture: 2.8,
      colorSpace: 'ACEScg',
      bitDepth: 16,
      lightingStyle: 'Cinematic three-point'
    },
    assetType: 'hero-image',
    tier: 'A'
  })
});

const data = await response.json();
console.log('Passed:', data.data.passed);
console.log('Score:', data.data.score);
console.log('Issues:', data.data.issues);

// Generate prompt header
const promptResponse = await fetch('/api/sight/prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: 'A',
    assetType: 'logo'
  })
});

const promptData = await promptResponse.json();
console.log(promptData.data.promptHeader);

// Validate and get suggestions
const suggestResponse = await fetch('/api/sight/validate-and-suggest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assetSpec: { /* ... */ },
    assetType: 'hero-image',
    tier: 'A'
  })
});

const suggestData = await suggestResponse.json();
console.log('Validation:', suggestData.data.validation);
console.log('Suggestion:', suggestData.data.suggestion);
```

## Configuration

### Authentication

Both adapters support authentication via the `requireAuth` and `getUserId` options:

```typescript
{
  requireAuth: true,
  getUserId: async (req: NextRequest) => {
    // Your auth logic here
    // Return user ID or null
    return 'user-id';
  }
}
```

### Callbacks

Add observability through callbacks:

```typescript
{
  onSuccess: async (result, userId) => {
    // Log to your analytics
    await analytics.track('ai_generation', {
      userId,
      provider: result.provider,
      cost: result.actualCost
    });
  },
  onError: async (error, userId) => {
    // Error tracking
    await errorTracker.captureException(error, { userId });
  }
}
```

## Error Handling

The adapters handle common errors automatically:

- **401 Unauthorized** - Missing or invalid authentication
- **400 Bad Request** - Invalid request body
- **429 Rate Limited** - Provider rate limit exceeded
- **504 Timeout** - Request timeout
- **503 Service Unavailable** - No suitable provider available
- **500 Internal Server Error** - Other errors

## Type Safety

All adapters are fully typed with TypeScript:

```typescript
import type { SilentEngineRouteConfig, SightEngineRouteConfig } from '@qbos/nextjs-adapter';
```

## Request Validation

Requests are automatically validated using Zod schemas. Invalid requests return detailed error messages:

```json
{
  "error": "Invalid request",
  "details": [
    {
      "path": ["messages"],
      "message": "Required"
    }
  ]
}
```

## License

MIT

---

**Built for QuietBuild OS™** - Precision Infrastructure for Trust-Based Products
