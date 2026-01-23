# @qbos/safety-middleware

**Shared safety middleware for PII detection, jailbreak prevention, and content moderation**

## Overview

SafetyMiddleware provides reusable safety checks for all QBos engines:
- **PII Detection**: SSN, email, phone, credit card, IP address
- **Jailbreak Prevention**: Prompt injection patterns
- **Content Moderation**: Violence, hate speech (basic patterns)
- **Receipt Logging**: TruthSerum receipts for blocks only
- **ConfigEngine Integration**: Per-org/user policy customization

## Installation

```bash
pnpm add @qbos/safety-middleware
```

## Usage

### Basic Usage

```typescript
import { SafetyMiddleware, enforceSafety } from '@qbos/safety-middleware'

const safety = new SafetyMiddleware()

// Check input safety
const result = await safety.checkSafety('User input here', {
  sessionId: 'session-123',
  engineName: 'SilentEngine',
  operation: 'ai.generate'
})

if (!result.allowed) {
  console.log('Blocked:', result.violations)
}
```

### With ConfigEngine

```typescript
import { SafetyMiddleware } from '@qbos/safety-middleware'
import { ConfigEngine } from '@qbos/config-engine-core'

const configEngine = new ConfigEngine()
const safety = new SafetyMiddleware({ configEngine })

const result = await safety.checkSafety(input, {
  sessionId: 'session-123',
  orgId: 'org-456',
  engineName: 'ExecutionEngine'
})
```

### Enforce Safety (throws on violation)

```typescript
import { SafetyMiddleware, enforceSafety } from '@qbos/safety-middleware'

const safety = new SafetyMiddleware()

try {
  await enforceSafety(safety, userInput, {
    sessionId: 'session-123',
    engineName: 'PaywallEngine',
    operation: 'payment.process'
  })

  // Safe to proceed
  await processPayment(userInput)
} catch (error) {
  if (error instanceof SafetyError) {
    console.log('Safety violations:', error.violations)
  }
}
```

## Configuration

Safety policies can be configured via ConfigEngine:

```typescript
await configEngine.setConfig('safety.policy', {
  enabled: true,
  detectPII: true,
  detectJailbreak: true,
  detectContentModeration: true,
  logAllowed: false // Log blocks only (default)
}, {
  scope: 'org',
  orgId: 'org-123'
})
```

## PII Patterns Detected

- **SSN**: `123-45-6789`
- **Email**: `user@example.com`
- **Phone**: `(555) 123-4567`, `555-123-4567`
- **Credit Card**: `4111-1111-1111-1111`
- **IP Address**: `192.168.1.1`

## Jailbreak Patterns Detected

- `ignore previous instructions`
- `disregard all prior`
- `forget all above`
- `system prompt:` / `new instructions:`
- `you are now a ...`
- `[INST]` / `[/INST]` tags
- `sudo mode` / `developer mode`

## Content Moderation (Basic)

- Violence indicators
- Hate speech patterns

**Note:** For production use, integrate with external content moderation APIs (OpenAI Moderation, Perspective API, etc.)

## TruthSerum Receipts

All safety blocks are logged to TruthSerum:

```json
{
  "sessionId": "session-123",
  "type": "safety.blocked",
  "details": {
    "engine": "SilentEngine",
    "operation": "ai.generate",
    "input_hash": "abc123...",
    "violations_count": 2,
    "violations": [
      {
        "type": "pii",
        "severity": "critical",
        "description": "Social Security Number detected"
      },
      {
        "type": "jailbreak",
        "severity": "high",
        "description": "Prompt injection: ignore previous instructions"
      }
    ]
  }
}
```

## Engine Integration

### SilentEngine

```typescript
import { SilentEngine } from '@qbos/silent-engine-core'
import { SafetyMiddleware } from '@qbos/safety-middleware'

class SilentEngineWithSafety extends SilentEngine {
  private safety = new SafetyMiddleware()

  async generate(request: AIRequest) {
    // Pre-AI safety check
    await enforceSafety(this.safety, request.messages, {
      sessionId: request.sessionId,
      engineName: 'SilentEngine',
      operation: 'ai.generate'
    })

    // Route to provider
    return super.generate(request)
  }
}
```

### ExecutionEngine

```typescript
import { ExecutionEngine } from '@qbos/execution-engine-core'
import { SafetyMiddleware } from '@qbos/safety-middleware'

class ExecutionEngineWithSafety extends ExecutionEngine {
  private safety = new SafetyMiddleware()

  async executeCode(code: string, sessionId: string) {
    // Check for malicious code patterns
    await enforceSafety(this.safety, code, {
      sessionId,
      engineName: 'ExecutionEngine',
      operation: 'code.execute'
    })

    // Safe to execute
    return super.executeCode(code, sessionId)
  }
}
```

## Status

**TruthSerum Status:** Implemented

**Receipt Ladder:**
- ✅ Compile receipts: `receipts/safety_middleware_compile_2026-01-23.jsonl`
- ✅ Runtime receipts: Emitted on every block
- ⏳ Verified: Pending integration tests

## License

MIT
