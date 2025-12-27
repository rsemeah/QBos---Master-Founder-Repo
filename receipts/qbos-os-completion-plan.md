# QBos OS Completion Plan: 40% → 90%+

**Current State:** 40% OS (TruthSerum verified)
**Target State:** 90%+ OS (Production guaranteed)
**Gap to Close:** 50 percentage points
**Method:** Structural additions + Retroactive enforcement

---

## PHASE 1: OS Foundations (Retroactive + Proactive)

### Task 1.1: Canonical AppSpec Schema
**Purpose:** Make every build provably correct to spec
**Type:** NEW + RETROACTIVE ENFORCEMENT

#### Implementation:

**File:** `packages/schemas/app-spec.schema.ts`
```typescript
export interface AppSpec {
  // FROZEN AT CAPTURE
  specVersion: "1.0.0";
  specId: string; // UUID
  frozenAt: string; // ISO timestamp

  // CORE IDENTITY
  appName: string;
  appType: AppArchetype; // "saas" | "marketplace" | "social" | etc
  targetPlatforms: ("web" | "ios" | "android")[];

  // DATA MODEL (FROZEN)
  dataModel: {
    entities: EntityDefinition[];
    relationships: RelationshipDefinition[];
    accessPatterns: AccessPattern[];
  };

  // ROLES & PERMISSIONS (FROZEN)
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];

  // USER FLOWS (FROZEN)
  flows: FlowDefinition[];

  // NON-GOALS (LOCKED)
  nonGoals: string[];

  // COMPLIANCE REQUIREMENTS
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    coppa: boolean;
    hipaa: boolean;
  };

  // ARCHITECTURE CONSTRAINTS
  architecture: {
    mono: boolean; // vs microservices
    edge: boolean; // vs server
    realtime: boolean; // vs polling
  };

  // RECEIPT PROOF
  specReceipt: {
    capturedBy: "rob" | "manual";
    conversationId?: string;
    verifiedAt: string;
    hash: string;
  };
}
```

#### Enforcement Points (RETROACTIVE):

**File:** `packages/engines/execution-engine/core/src/AppSpecValidator.ts`
```typescript
export class AppSpecValidator {
  /**
   * GATE: No code generation without frozen spec
   */
  async validateBeforeBuild(spec: AppSpec): Promise<ValidationResult> {
    const errors: string[] = [];

    // RULE 1: Spec must be frozen
    if (!spec.frozenAt) {
      errors.push("BLOCKED: AppSpec not frozen");
    }

    // RULE 2: Data model must have entities
    if (!spec.dataModel.entities.length) {
      errors.push("BLOCKED: No entities defined");
    }

    // RULE 3: At least one user flow
    if (!spec.flows.length) {
      errors.push("BLOCKED: No user flows defined");
    }

    // RULE 4: Architecture must be chosen
    if (spec.architecture.mono === undefined) {
      errors.push("BLOCKED: Architecture not selected");
    }

    if (errors.length > 0) {
      return { valid: false, errors, blockBuild: true };
    }

    return { valid: true, specHash: this.hashSpec(spec) };
  }
}
```

#### Integration (PROACTIVE + RETROACTIVE):

**Modify:** `packages/engines/execution-engine/core/src/RobEngine.ts`
```typescript
// BEFORE Line 150 (processBuildRequest)
async processBuildRequest(sessionId: string): Promise<BuildReceipt[]> {
  // NEW: Enforce AppSpec freeze gate
  const spec = await this.getAppSpec(sessionId);
  const validation = await this.specValidator.validateBeforeBuild(spec);

  if (!validation.valid) {
    throw new Error(`AppSpec validation failed: ${validation.errors.join(", ")}`);
  }

  // Emit spec.frozen receipt
  await this.receiptWriter.write({
    sessionId,
    type: "spec.frozen",
    details: {
      specId: spec.specId,
      specHash: validation.specHash,
      entityCount: spec.dataModel.entities.length,
      flowCount: spec.flows.length,
    }
  });

  // EXISTING CODE CONTINUES...
}
```

**NEW Build State:** Add `SPEC_FREEZE` between `IDEA_CAPTURE` and `TEMPLATE_MATCH`

---

### Task 1.2: Architecture Decision Lock
**Purpose:** Make architecture explicit, immutable, and receipted
**Type:** NEW + RETROACTIVE ENFORCEMENT

#### Implementation:

**File:** `packages/schemas/architecture-decision.schema.ts`
```typescript
export interface ArchitectureDecision {
  decisionId: string;
  sessionId: string;
  frozenAt: string;

  // CORE DECISIONS
  decisions: {
    // Data Layer
    database: "supabase" | "planetscale" | "mongodb";
    schema: "relational" | "document" | "hybrid";

    // Compute Layer
    runtime: "nextjs" | "remix" | "astro";
    deployment: "vercel" | "netlify" | "aws";
    compute: "edge" | "serverless" | "server";

    // Frontend
    framework: "react" | "vue" | "svelte";
    rendering: "ssr" | "ssg" | "spa";

    // Auth
    authProvider: "supabase" | "clerk" | "auth0";

    // File Storage
    storage: "supabase" | "s3" | "cloudinary";

    // AI Provider
    aiProvider: "anthropic" | "openai" | "both";
  };

  // CONSTRAINTS
  constraints: {
    maxLatency: number; // ms
    maxCost: number; // $ per month
    regions: string[];
  };

  // RATIONALE (from conversation)
  rationale: {
    why: string;
    tradeoffs: string[];
    alternatives: string[];
  };

  // IMMUTABILITY PROOF
  receipt: {
    hash: string;
    signature: string;
    lockedBy: string;
  };
}
```

#### Enforcement (RETROACTIVE):

**File:** `packages/engines/execution-engine/core/src/ArchitectureLock.ts`
```typescript
export class ArchitectureLock {
  /**
   * GATE: No template selection without locked architecture
   */
  async enforceArchitectureLock(sessionId: string): Promise<void> {
    const decision = await this.getArchitectureDecision(sessionId);

    if (!decision) {
      throw new Error("BLOCKED: Architecture not decided");
    }

    if (!decision.frozenAt) {
      throw new Error("BLOCKED: Architecture not frozen");
    }

    // Verify decisions are complete
    const required = ["database", "runtime", "deployment", "framework"];
    for (const key of required) {
      if (!decision.decisions[key]) {
        throw new Error(`BLOCKED: Missing architecture decision: ${key}`);
      }
    }

    // Emit architecture.locked receipt
    await this.receiptWriter.write({
      sessionId,
      type: "architecture.locked",
      details: {
        decisionId: decision.decisionId,
        hash: decision.receipt.hash,
        stack: this.getStackSummary(decision),
      }
    });
  }

  /**
   * RETROACTIVE: Generate architecture decision from existing builds
   */
  async inferArchitectureFromExisting(sessionId: string): Promise<ArchitectureDecision> {
    // For existing builds, infer decisions from current implementation
    return {
      decisionId: uuid(),
      sessionId,
      frozenAt: new Date().toISOString(),
      decisions: {
        database: "supabase", // INFERRED
        schema: "relational",
        runtime: "nextjs",
        deployment: "vercel",
        compute: "edge",
        framework: "react",
        rendering: "ssr",
        authProvider: "supabase",
        storage: "supabase",
        aiProvider: "anthropic",
      },
      constraints: {
        maxLatency: 200,
        maxCost: 100,
        regions: ["us-east-1"],
      },
      rationale: {
        why: "RETROACTIVELY INFERRED from existing implementation",
        tradeoffs: ["UNKNOWN - add via conversation"],
        alternatives: ["UNKNOWN - add via conversation"],
      },
      receipt: {
        hash: this.hash(decision),
        signature: "RETROACTIVE",
        lockedBy: "system",
      },
    };
  }
}
```

**NEW Build State:** Add `ARCHITECTURE_LOCK` between `SPEC_FREEZE` and `TEMPLATE_MATCH`

---

### Task 1.3: Single Atomic Deploy Primitive
**Purpose:** Deploy = one command, guaranteed verification
**Type:** NEW OS PRIMITIVE

#### Implementation:

**File:** `packages/engines/execution-engine/core/src/DeploymentOrchestrator.ts`
```typescript
export class DeploymentOrchestrator {
  /**
   * OS PRIMITIVE: Atomic deployment with verification
   */
  async deploy(sessionId: string): Promise<DeploymentReceipt> {
    const startTime = Date.now();

    try {
      // STEP 1: Pre-deployment checks
      await this.preDeploymentChecks(sessionId);

      // STEP 2: Deploy infrastructure (atomic transaction)
      const infra = await this.deployInfrastructure(sessionId);

      // STEP 3: Deploy application code
      const app = await this.deployApplication(sessionId, infra);

      // STEP 4: Run mandatory verifications
      const verification = await this.verifyDeployment(app);

      if (!verification.passed) {
        // ROLLBACK
        await this.rollback(sessionId, infra, app);
        throw new Error(`Deployment verification failed: ${verification.failures.join(", ")}`);
      }

      // STEP 5: Emit deployment.verified receipt
      const receipt = await this.receiptWriter.write({
        sessionId,
        type: "deployment.verified",
        details: {
          appUrl: app.url,
          deploymentId: app.deploymentId,
          infraIds: infra.resourceIds,
          verifications: verification.checks,
          duration: Date.now() - startTime,
        }
      });

      // STEP 6: Mark as LIVE
      await this.updateSessionState(sessionId, "LIVE");

      return {
        success: true,
        appUrl: app.url,
        receiptId: receipt.id,
        verifications: verification.checks,
      };

    } catch (error) {
      // Emit deployment.failed receipt
      await this.receiptWriter.write({
        sessionId,
        type: "deployment.failed",
        details: {
          error: error.message,
          duration: Date.now() - startTime,
        }
      });

      throw error;
    }
  }

  /**
   * Mandatory deployment verifications
   */
  private async verifyDeployment(app: AppDeployment): Promise<VerificationResult> {
    const checks: VerificationCheck[] = [];

    // CHECK 1: Health endpoint responds
    checks.push(await this.verifyHealthEndpoint(app.url));

    // CHECK 2: Database connection works
    checks.push(await this.verifyDatabaseConnection(app));

    // CHECK 3: Auth system works
    checks.push(await this.verifyAuth(app));

    // CHECK 4: Environment variables set
    checks.push(await this.verifyEnvVars(app));

    // CHECK 5: SSL certificate valid
    checks.push(await this.verifySSL(app.url));

    const failures = checks.filter(c => !c.passed);

    return {
      passed: failures.length === 0,
      checks,
      failures: failures.map(f => f.name),
    };
  }
}
```

**CLI Integration:**
```bash
# New atomic command
qbos deploy <session-id>

# What it does:
# 1. Pre-flight checks
# 2. Deploy infra + app (atomic)
# 3. Run 5 mandatory verifications
# 4. Emit deployment.verified receipt OR rollback
# 5. Update state to LIVE
```

---

## PHASE 2: App Store Compliance Layer (Proactive)

### Task 2.1: App Store Policy Mapper
**Purpose:** Map AppSpec → App Store requirements
**Type:** NEW COMPLIANCE ENGINE

#### Implementation:

**File:** `packages/engines/compliance-engine/core/src/AppStoreMapper.ts`
```typescript
export class AppStoreMapper {
  /**
   * Generate App Store compliance checklist from AppSpec
   */
  async generateComplianceChecklist(spec: AppSpec): Promise<ComplianceChecklist> {
    const checklist: ComplianceCheck[] = [];

    // iOS App Store Requirements
    if (spec.targetPlatforms.includes("ios")) {
      checklist.push(...this.iosRequirements(spec));
    }

    // Google Play Requirements
    if (spec.targetPlatforms.includes("android")) {
      checklist.push(...this.androidRequirements(spec));
    }

    // Web Requirements
    if (spec.targetPlatforms.includes("web")) {
      checklist.push(...this.webRequirements(spec));
    }

    return {
      checks: checklist,
      totalRequired: checklist.filter(c => c.required).length,
      totalOptional: checklist.filter(c => !c.required).length,
    };
  }

  private iosRequirements(spec: AppSpec): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    // RULE: Must have privacy policy if collecting data
    if (spec.dataModel.entities.some(e => e.containsPII)) {
      checks.push({
        id: "ios-privacy-policy",
        name: "Privacy Policy Required",
        required: true,
        status: "PENDING",
        action: "Generate privacy policy from AppSpec",
        evidence: null,
      });
    }

    // RULE: Must justify permissions
    const permissions = this.inferPermissions(spec);
    for (const perm of permissions) {
      checks.push({
        id: `ios-permission-${perm}`,
        name: `Justify ${perm} permission`,
        required: true,
        status: "PENDING",
        action: `Add NSUsageDescription for ${perm}`,
        evidence: null,
      });
    }

    // RULE: Must have data deletion flow
    if (spec.compliance.gdpr) {
      checks.push({
        id: "ios-data-deletion",
        name: "User data deletion",
        required: true,
        status: "PENDING",
        action: "Implement account deletion API",
        evidence: null,
      });
    }

    return checks;
  }
}
```

**NEW Build State:** Add `COMPLIANCE_REVIEW` before `CODE_DEPLOYING`

---

### Task 2.2: Privacy Policy Generator
**Purpose:** Auto-generate compliant privacy policy from AppSpec
**Type:** NEW AUTOMATION

#### Implementation:

**File:** `packages/engines/compliance-engine/core/src/PrivacyPolicyGenerator.ts`
```typescript
export class PrivacyPolicyGenerator {
  async generate(spec: AppSpec, arch: ArchitectureDecision): Promise<PrivacyPolicy> {
    // Infer data collection from spec
    const dataCollected = this.inferDataCollection(spec);

    // Infer third-party services from architecture
    const thirdParties = this.inferThirdParties(arch);

    // Generate policy sections
    const sections = {
      dataCollected: this.sectionDataCollected(dataCollected),
      dataUsage: this.sectionDataUsage(spec),
      dataSharing: this.sectionDataSharing(thirdParties),
      dataRetention: this.sectionDataRetention(spec),
      userRights: this.sectionUserRights(spec.compliance),
      security: this.sectionSecurity(arch),
      cookies: this.sectionCookies(spec.targetPlatforms),
      contact: this.sectionContact(),
    };

    return {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      appName: spec.appName,
      sections,
      markdown: this.renderMarkdown(sections),
      html: this.renderHTML(sections),
    };
  }
}
```

---

## PHASE 3: Active Monitoring Layer (Proactive)

### Task 3.1: Cost Drift Detector
**Purpose:** Alert when production costs exceed spec constraints
**Type:** NEW MONITORING PRIMITIVE

#### Implementation:

**File:** `packages/engines/observation-engine/core/src/CostDriftDetector.ts`
```typescript
export class CostDriftDetector {
  /**
   * Monitor actual costs vs architecture constraints
   */
  async detectDrift(sessionId: string): Promise<DriftReport> {
    const arch = await this.getArchitectureDecision(sessionId);
    const actualCosts = await this.getActualCosts(sessionId);

    const drift: CostDrift[] = [];

    // Check total cost
    if (actualCosts.total > arch.constraints.maxCost) {
      drift.push({
        type: "cost_exceeded",
        expected: arch.constraints.maxCost,
        actual: actualCosts.total,
        delta: actualCosts.total - arch.constraints.maxCost,
        severity: "critical",
      });
    }

    // Check per-service costs
    for (const [service, cost] of Object.entries(actualCosts.breakdown)) {
      const expected = this.getExpectedCost(service, arch);
      if (cost > expected * 1.5) { // 50% over
        drift.push({
          type: "service_cost_drift",
          service,
          expected,
          actual: cost,
          delta: cost - expected,
          severity: "warning",
        });
      }
    }

    // Emit drift receipt if detected
    if (drift.length > 0) {
      await this.receiptWriter.write({
        sessionId,
        type: "cost.drift.detected",
        details: { drift, timestamp: new Date().toISOString() },
      });
    }

    return { drift, hasIssues: drift.length > 0 };
  }
}
```

---

## RETROACTIVE APPLICATION PLAN

### Step 1: Audit Existing Build Sessions
```typescript
// Script to retroactively generate AppSpecs for existing builds
async function retroactiveSpecGeneration() {
  const sessions = await getAllBuildSessions();

  for (const session of sessions) {
    // Infer AppSpec from existing code and conversation
    const inferredSpec = await inferAppSpec(session);

    // Save as frozen spec
    await saveAppSpec(session.id, inferredSpec);

    // Emit retroactive receipt
    await emitReceipt({
      sessionId: session.id,
      type: "spec.retroactive",
      details: { inferred: true, confidence: "medium" },
    });
  }
}
```

### Step 2: Enforce Gates on Existing
```typescript
// Add validation layer to existing build sessions
async function addGatesToExisting() {
  const sessions = await getAllBuildSessions();

  for (const session of sessions) {
    // Add spec validation
    if (!session.appSpec) {
      session.status = "REQUIRES_SPEC";
    }

    // Add architecture lock
    if (!session.architectureDecision) {
      session.status = "REQUIRES_ARCHITECTURE";
    }

    await updateSession(session);
  }
}
```

---

## IMPLEMENTATION PRIORITY

### Week 1: Foundations
1. **Day 1-2:** AppSpec schema + validator
2. **Day 3-4:** Architecture lock mechanism
3. **Day 5:** Retroactive spec generation for existing builds

### Week 2: Deployment
1. **Day 1-3:** Single atomic deploy primitive
2. **Day 4-5:** Deployment verification suite

### Week 3: Compliance
1. **Day 1-2:** App Store policy mapper
2. **Day 3-4:** Privacy policy generator
3. **Day 5:** Compliance gate integration

### Week 4: Monitoring
1. **Day 1-2:** Cost drift detector
2. **Day 3-4:** Feature drift detector
3. **Day 5:** Monitoring dashboard

---

## SUCCESS CRITERIA (TruthSerum Verified)

After implementation, verify:
```bash
# Test 1: AppSpec exists for all builds
✅ find . -name "app-spec.json" | wc -l
   Expected: 1 per build session

# Test 2: Architecture decisions locked
✅ rg "architecture.locked" receipts/ | wc -l
   Expected: 1 per build session

# Test 3: Atomic deploy works
✅ qbos deploy test-session
   Expected: deployment.verified receipt OR rollback

# Test 4: Tests pass
✅ npm test
   Expected: 0 failures

# Test 5: Compliance checks generated
✅ qbos compliance check <session>
   Expected: Checklist with 0 blockers
```

---

**Plan complete. Ready for Codex handoff.**
