# ROB INTELLIGENCE LAYER - QUICK REFERENCE

## Overview

The Intelligence Layer enforces **"design intent as mechanical law"** throughout QuietBuild OS and Rob the Builder. It ensures Rob demonstrates super-genius intelligence for every user request, not just title updates.

**Target:** 10-year-old and grandma can create enterprise-grade apps on iPhone with zero technical experience.

---

## Three Phases (Complete ✅)

### Phase 0: Intelligence Contract ✅
**File:** `IntelligenceContract.ts`

Defines 7 intelligence receipt types:
- `idea.decomposed` - 3+ interpretations of user prompt (REQUIRED)
- `concept.inferred` - Core mechanics, patterns, domains (REQUIRED)
- `direction.recommended` - Ranked by feasibility (REQUIRED)
- `domain.risk_detected` - IP violations, legal issues (optional)
- `feasibility.assessed` - 1-10 score with reasoning (optional)
- `alternatives.generated` - Safe alternatives to risky ideas (optional)
- `mechanics.identified` - Core feature set (optional)

**Minimum Required:** 3 receipts (decomposed + inferred + recommended)

---

### Phase 1: Hard-Block Enforcement ✅
**File:** `IntelligenceGuard.ts`

Enforces intelligence requirements as **mechanical law** (unbypassable):

```typescript
import { IntelligenceGuard } from './intelligence';

// Guard an operation
const result = await IntelligenceGuard.guard(
  {
    sessionId: 'session_123',
    operation: 'processBuildRequest',
    receipts: intelligenceReceipts, // Must include minimum 3 types
  },
  async () => {
    // This only executes if intelligence requirements met
    return await doTheBuild();
  }
);

if (!result.allowed) {
  // BLOCKED - missing receipts
  console.log('Operation blocked:', result.error?.message);
}
```

**Title-Only Updates:** Automatically blocked - demonstrates zero intelligence.

---

### Phase 2: Idea Decomposition ✅
**File:** `IdeaDecomposer.ts`

Analyzes user prompts with pattern matching:
- **40+ domain patterns** (games, fintech, health, education, etc.)
- **50+ IP risk brands** (Pokemon, Marvel, Disney, Star Wars, etc.)
- **Feasibility scoring** (1-10 scale based on complexity, IP risk, tech constraints)
- **Alternative generation** (safe alternatives for IP-risky ideas)

```typescript
import { IdeaDecomposer } from './intelligence';

const decomposer = new IdeaDecomposer();
const result = await decomposer.decompose(
  sessionId,
  messageId,
  'Create a Pokemon battle app'
);

console.log('Interpretations:', result.interpretations);
// [
//   { interpretation: 'Monster collection game', domain: 'gaming', confidence: 0.95 },
//   { interpretation: 'Turn-based battle system', domain: 'gaming', confidence: 0.85 },
//   { interpretation: 'Trading card game', domain: 'gaming', confidence: 0.80 },
// ]

console.log('IP Risks:', result.risks);
// [
//   { brand: 'Pokemon', type: 'trademark', severity: 'high', 
//     alternative: 'MonsterDex - custom creature collection' }
// ]

console.log('Receipts:', result.receipts.length); // 7 receipts generated
```

---

### Phase 3: Living Preview Generator ✅
**File:** `PreviewGenerator.ts`

Generates working React components in <10 seconds:
- **2 full templates:** MonsterDex (gaming), TaskManager (productivity)
- **Interactive components:** useState, event handlers, modals, forms
- **Beautiful UI:** Tailwind CSS, gradients, animations
- **Touchable previews:** Users can click buttons, type in inputs

```typescript
import { PreviewGenerator } from './intelligence';

const generator = new PreviewGenerator();
const preview = await generator.generate(
  sessionId,
  messageId,
  intelligenceReceipts
);

console.log('Component:', preview.componentName); // 'MonsterDex'
console.log('Lines of Code:', preview.linesOfCode); // ~300
console.log('Interactivity:', preview.interactivityLevel); // 'dynamic'
console.log('Code:', preview.code); // Full React component ready to render
```

**Fallback:** If generation fails, returns placeholder component with error message.

---

## RobEngine Integration

### Complete Flow

```typescript
import { RobEngine } from './RobEngine';

const rob = new RobEngine();

// 1. Create session
const session = await rob.createSession('user_123', 'blank_canvas');

// 2. Decompose idea (generates intelligence receipts)
const decomposition = await rob.decomposeIdea(
  session.id,
  'msg_001',
  'Create Pokemon battle app'
);

// 3. Process build (with intelligence enforcement)
const result = await rob.processBuildRequest(
  session.id,
  'Create Pokemon battle app',
  decomposition.receipts // Intelligence receipts required!
);

if (result.success && result.preview) {
  // 4. Use living preview
  console.log('Preview ready:', result.preview.componentName);
  console.log('Code:', result.preview.code);
  // Render in iframe: <iframe srcdoc={preview.code} />
}
```

### Standalone Preview Generation

```typescript
// Generate preview without full build flow
const preview = await rob.generatePreview(
  sessionId,
  messageId,
  intelligenceReceipts
);
```

### Title-Only Update (BLOCKED)

```typescript
try {
  await rob.updateSessionMetadata(
    sessionId,
    { app_name: 'New Name' },
    [] // No intelligence receipts
  );
} catch (error) {
  // IntelligenceViolationError: Title-only updates are forbidden
}
```

---

## Templates

### MonsterDex (Gaming)
**Domain:** `gaming`, patterns: `collection`, `stats`, `battles`

Features:
- Search & filter by monster type
- Interactive cards with hover effects
- Detail modal with stat bars (HP, Attack, Defense)
- Gradient backgrounds, emoji icons
- 5 sample monsters (Flamewing, Aquafin, Thunderclaw, etc.)

**Lines:** ~300  
**Interactivity:** Dynamic (useState, onClick, modals)

---

### TaskManager (Productivity)
**Domain:** `productivity`, patterns: `add`, `complete`, `organize`

Features:
- Add/complete/delete tasks
- Priority filtering (high/medium/low)
- Statistics dashboard (total, completed, active)
- Due dates, categories
- Clean modern UI

**Lines:** ~250  
**Interactivity:** Dynamic (useState, forms, checkboxes)

---

## Receipt Flow

```
User Prompt
    ↓
IdeaDecomposer
    ↓
Intelligence Receipts (7 types)
    ↓
IntelligenceGuard.guard()
    ↓
[PASS] → executeBuild() → PreviewGenerator
    ↓
Living Preview (React component)

[FAIL] → BLOCKED state
    ↓
IntelligenceViolationError thrown
    ↓
Violation receipt emitted
```

---

## Domain Patterns (40+)

**Gaming:** pokemon, battle, rpg, card, monster, quest, level, inventory  
**Fintech:** payment, wallet, budget, expense, loan, invoice, transaction  
**Health:** fitness, workout, meditation, calorie, symptom, prescription  
**Education:** course, quiz, flashcard, lesson, assignment, grade  
**Productivity:** task, todo, reminder, note, calendar, schedule  
**Social:** chat, feed, post, message, friend, follow  
**E-commerce:** shop, cart, product, checkout, order  
**Real Estate:** property, listing, rent, mortgage  
**Travel:** booking, hotel, flight, itinerary  
**Food:** recipe, meal, diet, nutrition, restaurant  

---

## IP Risk Brands (50+)

**Gaming:** Pokemon, Mario, Zelda, Minecraft, Fortnite, Sonic, Pac-Man  
**Movies/TV:** Marvel, Disney, Star Wars, Harry Potter, Lord of the Rings  
**Sports:** NFL, NBA, FIFA, Premier League  
**Brands:** Nike, Adidas, Apple, Google, Tesla, Coca-Cola  

---

## Error Handling

### IntelligenceViolationError
Thrown when intelligence requirements not met:

```typescript
class IntelligenceViolationError extends Error {
  name: 'IntelligenceViolationError';
  missingReceipts: string[]; // Which receipts are missing
}
```

### Common Scenarios

1. **Missing Receipts:**
   ```
   Error: Intelligence requirements not met
   Missing: ['idea.decomposed', 'concept.inferred']
   → Solution: Call rob.decomposeIdea() first
   ```

2. **Low-Quality Receipts:**
   ```
   Error: Receipt quality validation failed
   → Solution: Receipts must have non-empty details
   ```

3. **Title-Only Update:**
   ```
   Error: Title-only updates demonstrate zero intelligence
   → Solution: Decompose the idea, generate intelligence receipts
   ```

---

## Testing

### Run Demo
```bash
cd /workspaces/QBos---Master-Founder-Repo
npx ts-node examples/rob-intelligence-demo.ts
```

**Expected Output:**
- ✅ Intelligence decomposition (3+ interpretations)
- ✅ IP risk detection (Pokemon → MonsterDex)
- ✅ Living preview generated (MonsterDex component)
- ✅ Total time: <10 seconds
- ✅ Title-only update blocked

---

## Receipts (TruthSerum Integration)

All intelligence operations emit receipts:

```typescript
{
  type: 'idea.decomposed',
  sessionId: 'session_123',
  messageId: 'msg_001',
  details: {
    interpretations: [...],
    domain: 'gaming',
    confidence: 0.95,
  },
  truthState: 'Verified',
  timestamp: '2025-12-24T...',
}
```

**TruthSerum Validation:**
- Receipt chains are validated for ordering
- Constitutional compliance checked
- All operations leave audit trail

---

## Next Steps (Pending)

### Phase 4: Domain Knowledge Files
Move domain patterns from code to structured files:
- `domains/gaming.yaml`
- `domains/fintech.yaml`
- `ip-risks/brands.json`

Enables non-technical users to edit patterns.

### Phase 5: IP Risk Warning Flow
Add UI warning modal:
```
⚠️  IP Risk Detected: "Pokemon"
We'll create a safe alternative: "MonsterDex"
[Cancel] [Proceed with MonsterDex]
```

### Phase 6: Integration Testing
End-to-end tests:
- Golden path: "Create Pokemon app" → working preview
- Failure path: Missing receipts → blocked
- Performance: <10 seconds target

---

## Key Principles

1. **Mechanical Law:** Intelligence requirements are unbypassable
2. **Proactive Intelligence:** Rob demonstrates genius, not questions
3. **Living Previews:** Touchable, interactive components in <10s
4. **IP Safety:** Detect risks, suggest safe alternatives
5. **Audit Trail:** Every operation emits receipts
6. **No Title-Only Updates:** Demonstrates zero intelligence (blocked)

---

## Files Changed

### Created (Phases 0-3)
- `intelligence/IntelligenceContract.ts` (198 lines)
- `intelligence/IntelligenceGuard.ts` (180 lines)
- `intelligence/IdeaDecomposer.ts` (510 lines)
- `intelligence/PreviewGenerator.ts` (511 lines)
- `intelligence/index.ts` (exports)

### Modified
- `RobEngine.ts` (added intelligence integration)
- `execution-engine/core/src/index.ts` (export intelligence layer)

### Commits
- `81a38bf` - Phase 0-2 (contract + enforcement + decomposition)
- `aa63ddd` - Phase 3 (living preview generator)

---

## Support

**Documentation:**
- `ROB_VERIFICATION_GUIDE.md` - Original Rob integration guide
- `QUIETBUILD_OS_FRAMEWORK.md` - Constitutional framework (528 lines)
- `RobSystemPrompt.ts` - Rob's proactive behavior (401 lines)

**Examples:**
- `examples/rob-intelligence-demo.ts` - Full flow demonstration
- `examples/rob-demo.ts` - Original Rob demo

---

**Last Updated:** 2025-12-24  
**Status:** Phases 0-3 Complete ✅  
**Performance:** <10 seconds demonstrated ✅  
**Enforcement:** Mechanical law active ✅
