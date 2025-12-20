# QuietBuild OS™ - Next.js Demo App

A full-featured demo application showcasing **SightEngine™** and **SilentEngine™** working together.

## Features

### 🧠 SilentEngine™ Demo
- AI generation with intelligent routing
- Automatic provider selection (Anthropic, OpenAI, Google)
- Cost and latency optimization
- Real-time performance metrics

### 👁️ SightEngine™ Demo
- Visual asset validation
- Multi-tier quality standards (A, B, C)
- Detailed scoring and issue reporting
- Cinema-grade requirements enforcement

## Getting Started

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cd examples/nextjs-demo
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

Get API keys:
- **Anthropic**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/api-keys
- **Google AI**: https://makersuite.google.com/app/apikey

### 3. Build Dependencies

Build the QBos packages:

```bash
# From repository root
npm run build
```

### 4. Run the Demo

```bash
cd examples/nextjs-demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What's Included

### API Routes

- `/api/ai/generate` - SilentEngine generation endpoint
- `/api/sight/validate` - SightEngine validation endpoint
- `/api/sight/prompt` - SightEngine prompt generation endpoint

### Key Files

- `src/lib/silent-engine.ts` - SilentEngine initialization with providers
- `src/app/page.tsx` - Interactive demo UI
- `src/app/api/` - Next.js API routes using QBos adapters

## Usage Examples

### SilentEngine - AI Generation

```typescript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Explain quantum computing' }
    ],
    maxCost: 0.001,
    maxLatency: 5000,
    preferredCapabilities: ['low_cost', 'fast_latency']
  })
});

const data = await response.json();
console.log(data.data.text);
console.log('Provider:', data.data.provider);
console.log('Cost:', data.data.cost);
```

### SightEngine - Asset Validation

```typescript
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
```

## Architecture

This demo showcases:

1. **Monorepo Integration** - Uses local QBos packages via npm workspaces
2. **Type Safety** - Full TypeScript coverage across engines
3. **API Route Adapters** - Clean Next.js integration patterns
4. **Provider Abstraction** - Seamless multi-provider AI routing
5. **Quality Standards** - Cinema-grade visual validation

## Customization

### Add More Providers

Edit `src/lib/silent-engine.ts`:

```typescript
const providers = [
  new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY }),
  new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  new GoogleProvider({ apiKey: process.env.GOOGLE_API_KEY }),
  // Add custom providers here
];
```

### Modify Routing Policies

Update policies in `src/lib/silent-engine.ts`:

```typescript
const customPolicy: RoutingPolicy = {
  key: 'custom_policy',
  name: 'Custom Policy',
  maxCost: 0.002,
  maxLatency: 2000,
  preferredCapabilities: ['vision', 'tool_use'],
  enableFallback: true,
};
```

### Change Visual Tiers

Modify the validation tier in `src/app/page.tsx` or create custom tier requirements.

## Deployment

### Vercel

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

## Performance

- **SilentEngine** automatically selects the fastest, cheapest provider
- **Circuit breakers** prevent cascading failures
- **Fallback routing** ensures high availability
- **Cost tracking** per request and aggregated

## Learn More

- [SightEngine README](../../packages/sight-engine/README.md)
- [SilentEngine README](../../packages/silent-engine/core/README.md)
- [Next.js Adapter README](../../packages/adapters/nextjs/README.md)
- [Main README](../../README.md)

## License

MIT

---

**This is world-changing infrastructure.** 🧠👁️
