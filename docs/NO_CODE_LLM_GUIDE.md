# No-Code LLM Guide for QuietBuild OS

**Build Production Apps with Claude, Cursor, Bolt, v0, and Other AI Tools**

This guide shows you how to use LLM-powered tools to extend QuietBuild OS without writing code manually. Perfect for founders, designers, and builders who want to ship fast.

---

## Table of Contents

1. [Overview](#overview)
2. [Recommended Tools](#recommended-tools)
3. [Quick Start](#quick-start)
4. [Using Claude Code](#using-claude-code)
5. [Using Cursor](#using-cursor)
6. [Using Bolt.new](#using-boltnew)
7. [Using v0 by Vercel](#using-v0-by-vercel)
8. [Common Tasks](#common-tasks)
9. [Prompts Library](#prompts-library)
10. [Best Practices](#best-practices)

---

## Overview

QuietBuild OS is designed to be LLM-friendly:
- **Clean Architecture**: Well-documented patterns
- **Complete Examples**: SafetyEngine as reference
- **TypeScript**: Type hints help LLMs generate correct code
- **Modular**: Each engine is independent

### What You Can Build

- ✅ New engines (payments, notifications, etc.)
- ✅ Custom features for existing engines
- ✅ UI dashboards for monitoring
- ✅ API endpoints
- ✅ Database migrations
- ✅ Event handlers
- ✅ Tests

---

## Recommended Tools

### Best for Full Engines

| Tool | Best For | Pros | Cons |
|------|----------|------|------|
| **Claude Code** | Complete features | Edits multiple files, understands architecture | Requires subscription |
| **Cursor** | Interactive coding | IDE integration, code completion | Learning curve |

### Best for UI Components

| Tool | Best For | Pros | Cons |
|------|----------|------|------|
| **v0** | React components | Beautiful UI, fast iterations | Limited to components |
| **Bolt.new** | Full-stack apps | Deploy instantly | Less control over architecture |

### Best for Quick Prototypes

| Tool | Best For | Pros | Cons |
|------|----------|------|------|
| **Claude Chat** | Planning, pseudocode | Free, accessible | No code execution |
| **ChatGPT** | Code snippets | Fast responses | Less context awareness |

---

## Quick Start

### Step 1: Choose Your Task

Pick what you want to build:
- **New Engine**: Follow [Using Claude Code](#using-claude-code)
- **UI Dashboard**: Follow [Using v0](#using-v0-by-vercel)
- **API Endpoint**: Follow [Using Cursor](#using-cursor)

### Step 2: Prepare Context

Share these files with your LLM tool:
1. `docs/ARCHITECTURE.md` - System architecture
2. `docs/ENGINE_IMPLEMENTATION_GUIDE.md` - How to build engines
3. `packages/engines/safety-engine/core/src/safety-engine.ts` - Reference engine

### Step 3: Use Prompt Templates

Copy prompts from [Prompts Library](#prompts-library) below.

---

## Using Claude Code

**Best for**: Implementing complete engines

### Setup

1. Install Claude Code CLI
2. Open your QuietBuild OS repo
3. Run `claude code`

### Example: Build PaywallEngine

**Prompt**:
```
I want to build PaywallEngine for QuietBuild OS. This engine should:

1. Integrate with Stripe for subscriptions
2. Listen for paywall.subscription.create events
3. Emit paywall.subscription.created when successful
4. Handle webhook events from Stripe
5. Store subscription data in Supabase

Reference files:
- packages/engines/safety-engine/core/src/safety-engine.ts (for engine structure)
- docs/ENGINE_IMPLEMENTATION_GUIDE.md (for implementation pattern)

Please:
1. Create packages/engines/paywall-engine/core/package.json
2. Create packages/engines/paywall-engine/core/src/types.ts
3. Create packages/engines/paywall-engine/core/src/paywall-engine.ts
4. Create packages/engines/paywall-engine/core/src/index.ts
5. Add README.md with usage examples

Follow the exact same structure as SafetyEngine.
```

**What Claude Code Will Do**:
- Read all reference files
- Create all necessary files
- Follow QuietBuild OS patterns
- Add proper TypeScript types
- Include error handling

### Example: Add Feature to Existing Engine

**Prompt**:
```
Add image moderation support to SafetyEngine:

1. Create new moderator: OpenAIModerator
2. Add to packages/engines/safety-engine/core/src/moderators/openai-moderator.ts
3. Integrate OpenAI Vision API
4. Support contentType: 'image'
5. Return violations for inappropriate images

Reference:
- packages/engines/safety-engine/core/src/moderators/pattern-moderator.ts

Please maintain the same pattern and add JSDoc comments.
```

---

## Using Cursor

**Best for**: Interactive development with IDE features

### Setup

1. Install Cursor IDE
2. Open QuietBuild OS folder
3. Enable Claude Sonnet model

### Example: Build API Endpoint

**Prompt (Cmd+K)**:
```
Create REST API endpoint for SafetyEngine moderation:

POST /api/moderate
Body: { content: string, contentType: string }
Response: { decision: string, violations: [], confidence: number }

Use:
- Next.js App Router (app/api/moderate/route.ts)
- SafetyEngine from @qbos/safety-engine-core
- Proper error handling
- TypeScript types

Create the file and explain usage.
```

### Example: Add Database Migration

**Prompt**:
```
Create database migration for PaywallEngine:

Tables needed:
- subscriptions (id, user_id, stripe_subscription_id, status, plan, created_at)
- payments (id, subscription_id, amount, status, stripe_payment_id, created_at)

Add to: packages/database/migrations/001_paywall.sql

Include:
- RLS policies (users see only their subscriptions)
- Indexes for performance
- Foreign key constraints
```

---

## Using Bolt.new

**Best for**: Quick full-stack prototypes

### Setup

1. Go to [bolt.new](https://bolt.new)
2. Sign in with GitHub

### Example: Build Admin Dashboard

**Prompt**:
```
Build an admin dashboard for QuietBuild OS SafetyEngine:

Features:
- List all flagged content
- Show moderation decisions
- Filter by violation type
- Actions: approve, reject, ban user

Tech stack:
- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase client
- Chart.js for metrics

Use modern UI with shadcn/ui components.

Database structure:
- qbos_events table with columns: id, name, payload (JSONB), status, created_at
- Filter events where name LIKE 'safety.content.%'
```

**What Bolt Will Do**:
- Generate full Next.js app
- Create UI components
- Add Supabase integration
- Deploy live preview
- Provide downloadable code

### Example: Build User Dashboard

**Prompt**:
```
Create user dashboard showing:
- My content moderation history
- Reputation score
- Recent safety events

Features:
- Login with Supabase Auth
- Fetch user's safety events
- Display in timeline format
- Show reputation badge

Use Next.js, TypeScript, Tailwind CSS.
```

---

## Using v0 by Vercel

**Best for**: Beautiful React components

### Setup

1. Go to [v0.dev](https://v0.dev)
2. Start new chat

### Example: Moderation Result Card

**Prompt**:
```
Create a React component showing moderation results:

Props:
- decision: 'approved' | 'flagged' | 'rejected'
- confidence: number (0-1)
- violations: Array<{ type: string, severity: number }>
- content: string

Design:
- Card with colored border (green=approved, yellow=flagged, red=rejected)
- Confidence as progress bar
- Violations list with severity badges
- Content preview (truncated)
- Tailwind CSS styling
- TypeScript
```

**What v0 Will Do**:
- Generate beautiful component
- Provide live preview
- Show multiple design options
- Export as React + Tailwind

### Example: Event Timeline

**Prompt**:
```
Create event timeline component:

Shows list of QuietBuild OS events with:
- Event name (e.g., "safety.content.approved")
- Timestamp
- Payload preview
- Status indicator
- Expandable details

Style: Modern, clean, vertical timeline with icons
Tech: React + TypeScript + Tailwind CSS
```

---

## Common Tasks

### Task 1: Add New Engine

**Tool**: Claude Code

**Files to share**:
- `docs/ENGINE_IMPLEMENTATION_GUIDE.md`
- `packages/engines/safety-engine/core/src/safety-engine.ts`

**Prompt template**:
```
Create {EngineName} for QuietBuild OS:

Purpose: {What the engine does}

Features:
1. {Feature 1}
2. {Feature 2}
3. {Feature 3}

Events:
- Listens: {events to listen for}
- Emits: {events to emit}

Follow SafetyEngine structure exactly.
Create all files in packages/engines/{engine-name}/core/
```

### Task 2: Build Admin UI

**Tool**: Bolt.new or v0

**Prompt template**:
```
Build admin dashboard for {EngineName}:

Pages:
1. Overview (metrics, charts)
2. {Resource} list (table with filters)
3. {Resource} details (view single item)

Tech: Next.js 14, TypeScript, Tailwind, Supabase

Database tables:
- {List tables and columns}

Use shadcn/ui components for consistent design.
```

### Task 3: Add Database Migration

**Tool**: Claude Code or Cursor

**Prompt template**:
```
Create database migration for {EngineName}:

Tables:
1. {table_name} - {description}
   Columns: {list columns with types}

2. {table_name_2} - {description}
   Columns: {list columns}

Requirements:
- RLS policies (users see only their data)
- Indexes for queries
- Foreign keys to auth.users
- Timestamps (created_at, updated_at)

File: packages/database/migrations/00X_{engine_name}.sql
```

### Task 4: Add Event Handler

**Tool**: Cursor

**Prompt template**:
```
Add event handler to {EngineName}:

Listen for: {event.name}
When triggered:
1. {Action 1}
2. {Action 2}
3. Emit: {result.event}

Add to: packages/engines/{engine-name}/core/src/{engine-name}.ts

Follow existing handleEvent pattern.
```

### Task 5: Write Tests

**Tool**: Claude Code

**Prompt template**:
```
Write tests for {EngineName}:

Test cases:
1. Engine initializes correctly
2. Handles {event} events
3. Emits {result-event} with correct payload
4. Health check returns true
5. Error handling works

Use:
- Jest or Vitest
- InMemoryEventBus for testing
- TypeScript

Create: packages/engines/{engine-name}/core/src/__tests__/{engine-name}.test.ts
```

---

## Prompts Library

### Prompt: Implement Full Engine

```
Implement {EngineName} for QuietBuild OS following this exact structure:

Reference Implementation:
- packages/engines/safety-engine/ (use as template)

Engine Details:
- ID: {engine-id}
- Purpose: {what it does}
- Dependencies: {other engines}

Events:
- Listens: {list events}
- Emits: {list events}

Config:
- {config option 1}: {type and description}
- {config option 2}: {type and description}

Public API:
- {method1}({params}): {return type} - {description}
- {method2}({params}): {return type} - {description}

Please create:
1. packages/engines/{engine-name}/core/package.json
2. packages/engines/{engine-name}/core/tsconfig.json
3. packages/engines/{engine-name}/core/src/types.ts
4. packages/engines/{engine-name}/core/src/{engine-name}.ts
5. packages/engines/{engine-name}/core/src/index.ts
6. packages/engines/{engine-name}/README.md

Follow SafetyEngine patterns exactly. Include:
- TypeScript types
- Error handling
- Health checks
- JSDoc comments
- Usage examples in README
```

### Prompt: Debug Event Flow

```
I'm having trouble with events in QuietBuild OS:

Expected: When I emit '{event.name}', {expected behavior}
Actual: {what's happening}

Event payload: {show payload}
Engine: {which engine}

Files:
- {list relevant files}

Please:
1. Explain what's wrong
2. Show the fix
3. Explain how event flow works
```

### Prompt: Add Integration

```
Integrate {Service Name} with {EngineName}:

Service: {Stripe, Resend, Twilio, etc.}
Purpose: {what it's for}

Requirements:
1. Add {service} client
2. Handle {operation}
3. Emit events on success/failure
4. Add webhook handler (if needed)
5. Add types for {service} responses

Please:
- Add to packages/engines/{engine-name}/
- Include error handling
- Add retry logic
- Show usage examples
```

### Prompt: Create UI Component

```
Create React component for QuietBuild OS:

Component: {ComponentName}
Purpose: {what it displays/does}

Props:
- {prop1}: {type} - {description}
- {prop2}: {type} - {description}

Design:
- {design requirements}
- Tailwind CSS
- Responsive
- Dark mode support

Data source:
- {where data comes from - Supabase, API, etc.}

Please provide:
1. Component code (TypeScript + React)
2. Usage example
3. Tailwind styles
```

---

## Best Practices

### 1. Always Share Context

Before asking LLM to generate code, share:
- Relevant documentation files
- Reference implementations
- Your database schema
- Existing code patterns

**Example**:
```
I'm building PaywallEngine. Here's the context:

Architecture: [paste ARCHITECTURE.md]
Reference: [paste safety-engine.ts]
Database: [paste relevant migration]

Now, please build PaywallEngine following the same pattern.
```

### 2. Break Down Complex Tasks

Don't ask for everything at once. Break into steps:

**❌ Bad**:
```
Build complete PaywallEngine with Stripe, subscriptions, webhooks, UI, tests, docs
```

**✅ Good**:
```
Step 1: Create PaywallEngine types and base structure
Step 2: Add Stripe integration
Step 3: Implement subscription handlers
Step 4: Add webhook endpoints
Step 5: Write tests
Step 6: Create documentation
```

### 3. Verify Before Moving On

After LLM generates code:
1. Build it: `pnpm build`
2. Test it: `pnpm test`
3. Run it: `pnpm dev`

If errors, share error messages with LLM for fixes.

### 4. Use Specific Examples

Instead of:
```
Add validation
```

Say:
```
Add validation like PatternModerator does:
- Check content is not empty
- Validate contentType is supported
- Return ModerationResult with violations
```

### 5. Request Documentation

Always ask for:
- JSDoc comments
- README files
- Usage examples
- Error handling

**Example**:
```
Create PaywallEngine and include:
- README.md with setup instructions
- Usage examples for each public method
- JSDoc comments on all functions
- Error handling examples
```

---

## Troubleshooting with LLMs

### Problem: Code Doesn't Compile

**Prompt**:
```
This code has TypeScript errors:

[paste code]

Errors:
[paste errors]

Reference working code:
[paste SafetyEngine example]

Please fix to match QuietBuild OS patterns.
```

### Problem: Events Not Working

**Prompt**:
```
Events aren't being processed:

Code:
[paste event emission code]

Expected: Event should be handled by {engine}
Actual: Nothing happens

Database:
[paste SELECT * FROM qbos_events WHERE status = 'pending']

Please debug and explain event flow.
```

### Problem: Database RLS Blocking Access

**Prompt**:
```
Getting RLS error:

Error: "new row violates row-level security policy"

Code:
[paste insert code]

Migration:
[paste RLS policies]

Please explain what's wrong and how to fix.
```

---

## Example Workflows

### Workflow 1: Build Complete Engine (2 hours)

**Tools**: Claude Code + Cursor

**Steps**:
1. **Claude Code**: Generate engine structure (15 min)
2. **Cursor**: Add integration (Stripe, etc.) (30 min)
3. **Claude Code**: Write tests (20 min)
4. **Cursor**: Debug and fix errors (20 min)
5. **Claude Code**: Generate documentation (15 min)
6. **Manual**: Test end-to-end (20 min)

### Workflow 2: Build Admin Dashboard (1 hour)

**Tools**: v0 + Bolt.new

**Steps**:
1. **v0**: Create component designs (15 min)
2. **Bolt.new**: Build full dashboard (30 min)
3. **Manual**: Connect to Supabase (10 min)
4. **Manual**: Deploy to Vercel (5 min)

### Workflow 3: Add New Feature (30 min)

**Tools**: Cursor

**Steps**:
1. **Cursor**: Describe feature (5 min)
2. **Cursor**: Generate code (10 min)
3. **Manual**: Test locally (10 min)
4. **Cursor**: Fix issues (5 min)

---

## Advanced Tips

### Tip 1: Chain Multiple Tools

Use each tool for its strength:

1. **Claude Chat**: Plan architecture
2. **Claude Code**: Generate engine code
3. **v0**: Design UI components
4. **Bolt.new**: Build admin dashboard
5. **Cursor**: Debug and refine

### Tip 2: Create Reusable Prompts

Save successful prompts for reuse:

```markdown
## Template: Create QuietBuild OS Engine

Implement {EngineName} following SafetyEngine pattern:
[... full prompt template ...]

## Variables to fill:
- EngineName: ___
- Purpose: ___
- Events: ___
- Features: ___
```

### Tip 3: Use Examples

LLMs work better with examples:

**Instead of**:
```
Create subscription management
```

**Say**:
```
Create subscription management like:

const paywall = qbos.registry.get('paywall-engine');
await paywall.createSubscription(userId, 'pro-plan');
await paywall.cancelSubscription(subscriptionId);
const sub = await paywall.getSubscription(userId);

Please implement PaywallEngine with these methods.
```

---

## Resources

### Documentation to Share

Always keep these handy:
- `docs/ARCHITECTURE.md`
- `docs/ENGINE_IMPLEMENTATION_GUIDE.md`
- `packages/engines/safety-engine/README.md`
- Example engine: `packages/engines/safety-engine/core/src/safety-engine.ts`

### External Learning

- [Cursor Documentation](https://cursor.sh/docs)
- [v0 Guide](https://v0.dev/docs)
- [Bolt.new Tutorial](https://bolt.new/docs)
- [Claude Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)

---

## Conclusion

You don't need to be an expert coder to build on QuietBuild OS. With LLM tools and these guides, you can:

- ✅ Build production-ready engines
- ✅ Create beautiful dashboards
- ✅ Extend existing features
- ✅ Ship fast

**Start building today!** Pick a tool, choose a task, and use the prompts in this guide.

---

**Questions?** Check other docs or ask Claude Code to help you! 🚀
