# QuietBuild OS™ - Master Founder Repository

**Precision Infrastructure for Trust-Based Products**

QuietBuild OS™ is a multi-engine infrastructure platform that enforces world-class standards across visual quality and AI operations. Built for products where trust is non-negotiable.

## 🧠 Core Engines

### 👁️ SightEngine™ - Visual Quality Standards

Enforces investor-grade visual quality across all brand assets.

**What It Does:**
- ✅ Validates visual assets against tier requirements (A: Investor-grade, B: Product-grade, C: Internal)
- ✅ Rejects AI-looking outputs, flat lighting, and low-quality visuals
- ✅ Generates AI prompts with embedded quality standards
- ✅ Enforces logo requirements (16px readable, 8K scalable)

**Quick Example:**

```typescript
import { validateAsset, generatePromptHeader } from '@qbos/sight-engine';

const result = validateAsset(assetSpec, 'hero-image', 'A');
console.log(result.passed); // true/false
console.log(result.score);  // 0-100
```

**Read more:** [packages/sight-engine/README.md](packages/sight-engine/README.md)

---

### 🧠 SilentEngine™ - Intelligent AI Routing

Routes AI requests to the best model based on capabilities, cost, latency, and availability.

**What It Does:**
- ✅ Capability-based routing (vision, tool use, reasoning, cost, latency)
- ✅ Circuit breaker with automatic fallback
- ✅ Safety checks (PII detection, jailbreak prevention)
- ✅ Complete observability (events, audit logs)
- ✅ Cost tracking and optimization

**Quick Example:**

```typescript
import { SilentEngine } from '@qbos/silent-engine-core';

const result = await silentEngine.generate({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  maxCost: 0.001,
  maxLatency: 3000,
  preferredCapabilities: ['low_cost', 'fast_latency']
});

console.log(result.response.text);
console.log('Cost:', result.actualCost);
console.log('Provider:', result.provider);
```

**Read more:** [packages/silent-engine/core/README.md](packages/silent-engine/core/README.md)

---

## 📦 Repository Structure

```
QuietBuild OS™ Master Founder Repo/
├── packages/
│   ├── sight-engine/              # Visual quality engine
│   │   ├── src/
│   │   │   ├── types.ts           # Quality tiers, camera specs, validation types
│   │   │   ├── validator.ts       # 11 validation functions
│   │   │   └── index.ts           # Public API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── silent-engine/             # AI routing engine
│       └── core/
│           ├── src/
│           │   ├── types.ts       # Provider interfaces, routing policies
│           │   ├── providers/     # Base provider abstraction
│           │   ├── routing/       # Capability matching, constraint evaluation
│           │   ├── fallback/      # Circuit breaker, fallback orchestrator
│           │   ├── safety/        # Safety classifier, PII detector
│           │   ├── observability/ # Event emitter, audit logger
│           │   ├── silent-engine.ts # Main engine class
│           │   └── index.ts       # Public API
│           ├── package.json
│           ├── tsconfig.json
│           └── README.md
│
├── supabase/                      # Shared Supabase configuration
│   └── migrations/                # Database migrations (future)
│
└── README.md                      # This file
```

---

## 🎯 How the Engines Work Together

```
┌──────────────────────────────────────────────────────────────┐
│                    QuietBuild OS™                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  👁️ SightEngine™           🧠 SilentEngine™                 │
│  Visual Standards           AI Routing                       │
│                                                              │
│  • Tier A: Investor-grade   • Capability-based routing      │
│  • Tier B: Product-grade    • Circuit breaker + fallback    │
│  • Tier C: Internal         • Cost & latency optimization   │
│                                                              │
│  Rejects:                   Supports:                        │
│  ❌ Flat AI lighting        ✅ Anthropic, OpenAI, Google    │
│  ❌ Over-saturation         ✅ Dynamic provider selection    │
│  ❌ Low-res upscales        ✅ Safety checks                 │
│  ❌ "Midjourney mush"       ✅ Audit logging                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Integration:
- SilentEngine emits events → SightEngine validates AI-generated visuals
- SightEngine generates prompts → SilentEngine routes to best model
- Shared philosophy: Trust through precision
```

---

## 🚀 Getting Started

### Quick Start (5 Minutes)

```bash
# Clone and install
git clone https://github.com/rsemeah/QBos---Master-Founder-Repo.git
cd QBos---Master-Founder-Repo
npm install

# Build all packages
npm run build

# Try the demo app
cd examples/nextjs-demo
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open http://localhost:3000 to see both engines in action!

**📖 Full Guide:** [GETTING_STARTED.md](GETTING_STARTED.md)

### Install Individual Packages

```bash
# Install from monorepo root
npm install

# Or individual packages
cd packages/sight-engine && npm install
cd packages/silent-engine/core && npm install
cd packages/adapters/nextjs && npm install
```

### Build Packages

```bash
# Build all packages
npm run build

# Or build individually
npm run build:sight
npm run build:silent
npm run build:adapters
```

### Use in Your Project

```typescript
// Visual quality validation
import { validateAsset, generatePromptHeader } from '@qbos/sight-engine';

// AI routing
import { SilentEngine } from '@qbos/silent-engine-core';
import { AnthropicProvider } from '@qbos/silent-engine-core/dist/providers/anthropic-provider';

// Next.js API adapters
import { createSilentEngineRoute, createSightEngineValidateRoute } from '@qbos/nextjs-adapter';
```

---

## 📊 Key Standards

### SightEngine™ Tier A Requirements

| Standard | Value |
|----------|-------|
| Resolution | 4K minimum (3840×2160) |
| Camera | ARRI Alexa 65 / RED V-Raptor 8K |
| Lens | Prime lenses (50mm/65mm/80mm) |
| Aperture | f/2.8 - f/4.0 |
| Color Space | ACEScg (master), Display P3 (delivery) |
| Bit Depth | 16-bit |
| Lighting | Cinematic three-point or Rembrandt |

### SilentEngine™ Capabilities

| Capability | Description |
|------------|-------------|
| `long_context` | 100K+ token context |
| `tool_use` | Function calling |
| `vision` | Image understanding |
| `streaming` | Streaming responses |
| `code_generation` | Code-focused models |
| `strong_reasoning` | Complex reasoning (Claude Opus, o1) |
| `low_cost` | Cost-optimized |
| `fast_latency` | Low latency |

---

## 🧪 Example Integration

```typescript
import { SilentEngine } from '@qbos/silent-engine-core';
import { validateAsset, generatePromptHeader } from '@qbos/sight-engine';

// Initialize SilentEngine
const silentEngine = new SilentEngine({
  providers: [anthropic, openai, google],
  policies: [costOptimized, qualityFirst],
  defaultPolicyKey: 'cost_optimized'
});

// Generate visual with SightEngine standards
const prompt = `
${generatePromptHeader('A')}

Create a logo for CharterEngine - a legal governance system.
Style: Engineered, precise, minimal
Colors: Deep blue, white
`;

const result = await silentEngine.generate({
  messages: [{ role: 'user', content: prompt }],
  preferredCapabilities: ['vision', 'high_quality']
});

console.log('Generated visual description:', result.response.text);

// Validate the generated visual (in production, this would be the actual image)
const validation = validateAsset(visualSpec, 'logo', 'A');
console.log('Passes SightEngine standards:', validation.passed);
```

---

## 🎨 Philosophy

### SightEngine™
**Ensures you look professional.**

Visual excellence is non-negotiable for trust-based products. SightEngine™ enforces standards that separate investor-grade brands from amateur outputs.

### SilentEngine™
**Makes intelligent decisions so you don't have to.**

AI routing should be deterministic, observable, and explainable. SilentEngine™ ensures every request uses the best model for the job.

### Together
**Foundation of Trust for QuietBuild OS™**

- **Visual Trust** - Investor-grade visuals
- **Operational Trust** - Intelligent AI routing
- **Architectural Trust** - Composable, replaceable, auditable

---

## 📝 Success Criteria

✅ **An experienced engineer would say:** "This could run a serious AI platform"
✅ **An investor would say:** "This is real infrastructure"
✅ **Future-you can:** Add a brand-new LLM in minutes, not days

---

## 🔮 Roadmap

- [x] SightEngine™ - Visual quality standards
- [x] SilentEngine™ - AI routing engine
- [x] Supabase migrations for both engines
- [x] Provider implementations (Anthropic, OpenAI, Google)
- [x] Next.js API adapters
- [x] Full-featured demo application
- [x] Monorepo setup with workspaces
- [ ] CharterEngine™ integration (legal governance)
- [ ] Multi-tenant support (org policies)
- [ ] Real-time observability dashboard
- [ ] Python SDK
- [ ] Streaming support in providers

---

## 📁 What's New

### ✨ Latest Additions

**Provider Implementations**
- Full Anthropic SDK integration (Claude 3.5, Opus, Haiku)
- Complete OpenAI support (GPT-4, GPT-4o, GPT-3.5)
- Google AI integration (Gemini 1.5 Pro/Flash)
- Cost calculation and health checks

**Next.js Adapters**
- `@qbos/nextjs-adapter` package
- Type-safe API route creators
- Built-in auth support
- Streaming responses
- Automatic error handling

**Database Migrations**
- Complete Supabase schema for SightEngine
- Complete Supabase schema for SilentEngine
- Audit logging and metrics tables
- Circuit breaker state tracking
- RLS policies and indexes

**Demo Application**
- Full-featured Next.js 14 app
- Interactive SilentEngine demo
- Interactive SightEngine demo
- Tailwind CSS UI
- Real-time validation

**Monorepo**
- npm workspaces configuration
- Unified build scripts
- Shared dependencies
- Examples directory

---

## 📄 License

MIT

---

## 🚀 THIS IS WORLD-CHANGING INFRASTRUCTURE

QuietBuild OS™ determines whether your product is **average** or **inevitable**.

**This is inevitable.** 🧠👁️