# QuietBuild OS™ - Getting Started Guide

Welcome to QuietBuild OS™ - Precision Infrastructure for Trust-Based Products.

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Git
- API keys for at least one AI provider (Anthropic, OpenAI, or Google)

## 🚀 Quick Start (5 minutes)

### 1. Clone and Install

```bash
git clone https://github.com/rsemeah/QBos---Master-Founder-Repo.git
cd QBos---Master-Founder-Repo
npm install
```

### 2. Build All Packages

```bash
npm run build
```

This builds:
- ✅ SightEngine™ (Visual quality standards)
- ✅ SilentEngine™ (AI routing)
- ✅ Next.js Adapters

### 3. Try the Demo App

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

Run the demo:

```bash
npm run dev
```

Open http://localhost:3000 and try both engines!

## 📦 Repository Structure

```
QuietBuild OS™/
├── packages/
│   ├── sight-engine/              # 👁️ Visual quality engine
│   ├── silent-engine/core/        # 🧠 AI routing engine
│   └── adapters/nextjs/           # Next.js API adapters
│
├── supabase/
│   └── migrations/                # Database schemas
│
├── examples/
│   └── nextjs-demo/               # Full-featured demo app
│
└── package.json                   # Monorepo root
```

## 🎯 What Can You Build?

### With SightEngine™

- **Visual Asset Validation** - Enforce quality tiers across all brand assets
- **AI Prompt Generation** - Embed quality standards into AI prompts
- **Logo Requirements** - 16px readable, 8K scalable validation
- **Cinema-Grade Checks** - ARRI Alexa, RED cameras, proper lighting

### With SilentEngine™

- **Intelligent AI Routing** - Automatic model selection based on capabilities
- **Cost Optimization** - Route to cheapest suitable provider
- **Latency Control** - Speed-first routing when needed
- **Circuit Breakers** - Automatic failover on provider issues
- **Complete Observability** - Track every request, cost, and decision

## 📚 Core Concepts

### SightEngine™ Tiers

| Tier | Use Case | Resolution | Standards |
|------|----------|------------|-----------|
| **A** | Investor-grade | 4K+ | Cinema cameras, 16-bit, perfect lighting |
| **B** | Product-grade | 1080p+ | Professional cameras, good lighting |
| **C** | Internal-grade | 720p+ | Standard quality |

### SilentEngine™ Capabilities

- `long_context` - 100K+ tokens
- `tool_use` - Function calling
- `vision` - Image understanding
- `streaming` - Streaming responses
- `code_generation` - Code-focused
- `strong_reasoning` - Complex reasoning
- `low_cost` - Cost-optimized
- `fast_latency` - Low latency

## 🔧 Integration Patterns

### Pattern 1: Next.js API Routes

```typescript
// app/api/ai/generate/route.ts
import { createSilentEngineRoute } from '@qbos/nextjs-adapter';
import { silentEngine } from '@/lib/silent-engine';

export const POST = createSilentEngineRoute({
  engine: silentEngine,
  requireAuth: true,
  getUserId: async (req) => {
    // Your auth logic
  }
});
```

### Pattern 2: Direct Engine Usage

```typescript
import { SilentEngine } from '@qbos/silent-engine-core';
import { AnthropicProvider } from '@qbos/silent-engine-core/dist/providers/anthropic-provider';

const engine = new SilentEngine({
  providers: [new AnthropicProvider({ apiKey: 'sk-ant-...' })],
  policies: [/* routing policies */],
});

const result = await engine.generate({
  messages: [{ role: 'user', content: 'Hello' }],
  maxCost: 0.001,
});
```

### Pattern 3: Visual Validation

```typescript
import { validateAsset } from '@qbos/sight-engine';

const result = validateAsset(assetSpec, 'hero-image', 'A');
console.log(result.passed); // true/false
console.log(result.score);  // 0-100
console.log(result.issues); // Array of issues
```

## 🗄️ Database Setup (Optional)

If you want to use the Supabase integration:

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Initialize Supabase

```bash
supabase init
supabase start
```

### 3. Run Migrations

```bash
supabase db reset
```

This creates:
- SightEngine tables (assets, validations, prompts)
- SilentEngine tables (providers, models, audit logs)
- Metrics and observability tables

### 4. Connect to Your Project

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## 📖 Detailed Documentation

- **SightEngine**: [packages/sight-engine/README.md](packages/sight-engine/README.md)
- **SilentEngine**: [packages/silent-engine/core/README.md](packages/silent-engine/core/README.md)
- **Next.js Adapters**: [packages/adapters/nextjs/README.md](packages/adapters/nextjs/README.md)
- **Supabase Migrations**: [supabase/README.md](supabase/README.md)
- **Demo App**: [examples/nextjs-demo/README.md](examples/nextjs-demo/README.md)

## 🎨 Example Use Cases

### 1. Cost-Optimized Chatbot

```typescript
await engine.generate({
  messages: [{ role: 'user', content: 'Hello' }],
  preferredCapabilities: ['low_cost', 'fast_latency'],
  maxCost: 0.0005,
});
```

### 2. High-Quality Analysis

```typescript
await engine.generate({
  messages: [{ role: 'user', content: 'Analyze this data' }],
  preferredCapabilities: ['strong_reasoning', 'long_context'],
  // No cost limit - quality first
});
```

### 3. Vision Task

```typescript
await engine.generate({
  messages: [
    { role: 'user', content: 'Describe this image' }
  ],
  requiredCapabilities: ['vision'],
});
```

### 4. Logo Validation

```typescript
const result = validateAsset({
  resolutionWidth: 8192,
  resolutionHeight: 8192,
  // ... other specs
}, 'logo', 'A');

if (!result.passed) {
  console.log('Logo failed validation:', result.issues);
}
```

## 🔐 Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Enable authentication** - Set `requireAuth: true` in production
3. **Use RLS policies** - Configure Supabase Row Level Security
4. **Rate limiting** - Add rate limiting to your API routes
5. **Input validation** - Already included via Zod schemas

## 🚀 Deployment

### Vercel

```bash
cd examples/nextjs-demo
vercel deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Required for production:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `SUPABASE_URL` (optional)
- `SUPABASE_ANON_KEY` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` (optional)

## 📊 Monitoring & Observability

All engines emit events and create audit logs:

- **Request tracking** - Every AI request is logged
- **Cost tracking** - Per-request and aggregated costs
- **Performance metrics** - Latency, success rate, failure modes
- **Circuit breaker state** - Provider health monitoring

Access via Supabase tables:
- `silent_audit_logs` - Complete request history
- `silent_provider_metrics` - Performance trends
- `sight_validation_results` - Visual quality scores

## 🐛 Troubleshooting

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Import Errors

Ensure you've built the packages first:

```bash
npm run build
```

### Provider Errors

Check your API keys in `.env.local`:

```bash
echo $ANTHROPIC_API_KEY  # Should not be empty
```

### Type Errors

Make sure TypeScript is installed:

```bash
npm install -D typescript
```

## 🤝 Contributing

This is a master founder repository. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT

## 🎯 Next Steps

1. ✅ Run the demo app
2. ✅ Explore both engines
3. ✅ Read the detailed READMEs
4. ✅ Integrate into your project
5. ✅ Deploy to production

## 💡 Questions?

- Check the [main README](README.md)
- Read engine-specific documentation
- Review the demo app code

---

**Built for QuietBuild OS™** - This is inevitable. 🧠👁️
