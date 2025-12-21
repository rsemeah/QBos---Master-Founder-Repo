# QBos Proof Harness

Minimal Next.js app that exposes QuietBuild OS API endpoints for verification and CI.

## Purpose

This is **NOT a product**. It's a proof harness to verify that QBos engine foundation works correctly. It provides minimal API endpoints for:

- Health checking
- SightEngine event tracking
- CharterEngine consent acceptance (stubbed)
- AI invocation with safety checks

## Installation

```bash
# From repository root
pnpm install

# Or from this directory
cd apps/proof-harness
pnpm install
```

## Development

```bash
# Start development server
pnpm dev

# TypeScript type checking
pnpm typecheck

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
NODE_ENV=development
QBOS_ENV=dev

# Optional (for consent checking)
CONSENT_REQUIRED=false

# Optional (at least one required for AI invoke)
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GOOGLE_API_KEY=your-key

# Optional (for database features)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
```

## API Endpoints

### 1. GET /api/health

Health check and system information.

```bash
curl http://localhost:3000/api/health
```

### 2. POST /api/sight/track

Track SightEngine events (non-blocking).

```bash
curl -X POST http://localhost:3000/api/sight/track \
  -H "Content-Type: application/json" \
  -d '{"eventType":"user_action","eventName":"test"}'
```

### 3. POST /api/charter/consent/accept

Accept user consent (stubbed until CharterEngine is implemented).

```bash
curl -X POST http://localhost:3000/api/charter/consent/accept \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","documentType":"terms","version":"1.0"}'
```

### 4. POST /api/ai/invoke

Invoke AI with safety checks.

```bash
curl -X POST http://localhost:3000/api/ai/invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test prompt","userId":"user_123"}'
```

## Documentation

See [`docs/proof/PROOF_GATES.md`](../../docs/proof/PROOF_GATES.md) for complete curl examples and validation steps.

## Testing

```bash
# Run TypeScript checks
pnpm typecheck

# Build to verify no errors
pnpm build
```

## Architecture

This app uses:

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **QBos Packages**:
  - `@qbos/runtime` (EngineRegistry)
  - `@qbos/events` (EventBus)
  - `@qbos/database` (types)
  - `@qbos/safety-engine-core` (SafetyEngine)

## Non-Negotiables

✅ **Minimal** - Only proof-of-concept endpoints
✅ **Non-blocking** - SightEngine tracking never fails the request
✅ **Graceful degradation** - Works even when dependencies are missing
✅ **Stubbed engines** - CharterEngine stubbed until implemented
✅ **Clear errors** - Returns proper error types for debugging

## Deployment

### Development

```bash
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/proof-harness ./apps/proof-harness

# Install pnpm
RUN npm install -g pnpm@8.12.0

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter @qbos/proof-harness build

# Start
CMD ["pnpm", "--filter", "@qbos/proof-harness", "start"]
```

## CI Integration

These endpoints are designed for CI/CD verification. See `docs/proof/PROOF_GATES.md` for a validation script.

## License

MIT
