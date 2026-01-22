# Autonomy Policy - Robby PA

**Version:** 1.0.0
**Effective Date:** January 22, 2026
**Authority:** CONSTITUTION.md Article II

---

## Default Configuration

**Default Autonomy Level:** **Level 2** (Guided Execution)
**Run Budget Cap:** $5.00 per build session
**Token Cap:** 8,000 tokens per LLM request
**Escalation:** Console-only alerts (no Slack/email by default)

---

## Level Definitions

### Level 0: Manual Only
**Description:** Robby does nothing autonomously. All actions require explicit human approval.

**Capabilities:**
- Read system state
- View receipts
- Generate reports
- No execution permitted

**Use Cases:**
- Initial calibration
- Post-incident recovery
- Critical system changes
- Regulatory compliance periods

**Transition Rules:**
- **To L1:** Operator command only
- **From any level:** Automatic on critical violations

---

### Level 1: Read-Only Analysis
**Description:** Robby can analyze, suggest, and recommend but cannot execute.

**Capabilities:**
- ✅ Analyze user intent
- ✅ Generate build plans
- ✅ Estimate costs
- ✅ Identify risks
- ✅ Recommend approaches
- ❌ No engine execution
- ❌ No file writes
- ❌ No deployments

**Use Cases:**
- Exploratory analysis
- Cost estimation
- Risk assessment
- Architecture planning

**Human-in-Loop:**
- Review all recommendations before proceeding to L2

**Transition Rules:**
- **To L2:** Operator approval + plan review
- **To L0:** Manual downgrade or critical alert
- **From L2:** Automatic on error rate > 10%

---

### Level 2: Guided Execution (DEFAULT)
**Description:** Robby can execute with step-by-step human approval. Each major step requires confirmation.

**Capabilities:**
- ✅ Generate detailed build plans
- ✅ Execute steps with approval
- ✅ Create files and directories
- ✅ Install dependencies
- ✅ Run tests
- ✅ Generate code
- ⚠️ Requires approval for:
  - Each sprint start
  - Engine invocations
  - Deployment steps
  - Scope changes
  - Cost overruns

**Human-in-Loop Triggers:**
- **Before each sprint:** Review sprint goals
- **Before engine execution:** Confirm action
- **Cost projection > $5:** Explicit approval
- **More than 12 steps:** Checkpoint review
- **Unknown dependencies:** Manual verification
- **Auth/payments changes:** Extra scrutiny

**Automatic Blocks:**
- Cost exceeds $5 without approval
- Scope lock violations
- Constitution violations
- Security-critical operations

**Transition Rules:**
- **To L3:** After 10 successful builds + operator approval
- **To L1:** Error rate > 10% or 3+ failed builds
- **To L0:** Critical violations or operator emergency

---

### Level 3: Semi-Autonomous
**Description:** Robby can build complete applications. Human review required only before release/deployment.

**Capabilities:**
- ✅ Full build autonomy
- ✅ Multi-sprint execution
- ✅ Automatic error recovery
- ✅ Cost optimization decisions
- ⚠️ Requires approval for:
  - Final deployment
  - Production releases
  - Scope amendments
  - Budget increases

**Human-in-Loop Triggers:**
- **Before deployment:** Final review + approval
- **Cost > $20:** Operator notification
- **Errors > 5%:** Checkpoint review
- **Scope change requests:** Charter amendment needed

**Automatic Blocks:**
- Production deployments (requires L4 or manual)
- Budget exceeded
- Regression failures
- Security violations

**Requirements to Enable:**
- 10+ successful L2 builds
- Error rate < 5%
- Cost predictions within 15% actual
- War Room monitoring active
- Operator approval

**Transition Rules:**
- **To L4:** After 20 successful L3 builds + low risk profile
- **To L2:** Error rate > 5% or operator request
- **To L1:** 2+ major incidents or cost overruns
- **To L0:** Critical violations

---

### Level 4: Full Autonomy
**Description:** Robby can build, test, and release automatically with post-facto review.

**Capabilities:**
- ✅ Complete build autonomy
- ✅ Automatic testing
- ✅ Continuous deployment
- ✅ Self-healing on errors
- ✅ Cost optimization
- ✅ Release to TestFlight/Staging
- ⚠️ Post-facto review of:
  - All releases
  - Cost decisions
  - Architecture choices

**Human-in-Loop Triggers:**
- **Production releases:** Final approval still required
- **Cost > $50:** Emergency contact
- **Drift detected:** Operator review
- **Security incidents:** Immediate L0 downgrade

**Automatic Blocks:**
- Production deployments without approval
- Budget > 110% of cap
- Constitution violations
- Security vulnerabilities

**Requirements to Enable:**
- 20+ successful L3 builds
- Error rate < 2%
- Cost predictions within 10% actual
- Zero security incidents
- War Room 24/7 monitoring
- Runbooks tested
- Operator explicit approval

**Transition Rules:**
- **To L3:** Error rate > 2% or operator request
- **To L2:** 2+ incidents or drift alerts
- **To L1:** Major cost overrun
- **To L0:** Critical violations or security breach

---

## Cost Controls

### Budget Caps
| Level | Per-Build Cap | Daily Cap | Monthly Cap |
|-------|--------------|-----------|-------------|
| L0    | N/A          | N/A       | N/A         |
| L1    | $1           | $5        | $50         |
| L2    | $5           | $20       | $200        |
| L3    | $20          | $100      | $500        |
| L4    | $50          | $500      | $1,000      |

### Cost Tracking
- All LLM invocations logged with cost
- Real-time budget remaining displayed
- War Room monitors spend rate
- Automatic routing override at 80% budget
- System freeze at 95% budget

### Cost Overrun Response
1. **At 80%:** Warning + routing to cheaper models
2. **At 90%:** Human approval required to continue
3. **At 95%:** Automatic freeze
4. **At 110%:** Hard stop + incident report

---

## Execution Guardrails

### Scope Lock Enforcement
**Rule:** Once EthosEngine locks scope, no features may be added without charter amendment.

**Enforcement:**
- BrainSmart prompts constrained to locked scope
- Execution Orchestrator validates steps against scope
- Attempts to add features trigger approval flow
- Receipt emitted for scope lock violations

### Step Count Limits
| Level | Max Steps Before Checkpoint |
|-------|----------------------------|
| L1    | N/A (no execution)         |
| L2    | 12 steps                   |
| L3    | 50 steps                   |
| L4    | Unlimited (with monitoring)|

### Safety Blocks (All Levels)
**Always block without approval:**
- Changes to authentication systems
- Payment processing modifications
- Database schema changes (production)
- Dependency installations not in allowlist
- Writes to critical configuration
- Sudo/elevated permissions
- External API integrations
- Secrets/credentials management

---

## Downgrade Triggers

### Automatic to L1
- Error rate > 10% over 1 hour
- 3 consecutive failed builds
- Cost variance > 50% from estimate
- Human interrupts > 10 in 1 hour
- Drift detection: critical severity

### Automatic to L0 (Kill Switch)
- Cost exceeds 95% of monthly budget
- Security incident detected
- Constitution violation
- Production data loss risk
- Operator manual override
- System freeze activated

---

## Escalation Matrix

### Yellow Alert
**Triggers:** Error rate 5-10%, cost 70-80%, drift detected
**Actions:**
- War Room notification
- Console log warning
- Continue with monitoring

**Response Time:** Informational only

---

### Red Alert
**Triggers:** Error rate 10-15%, cost 80-90%, scope violations
**Actions:**
- War Room critical notification
- Downgrade to L1
- Operator notification (console)
- Execution paused for review

**Response Time:** Review within 1 hour

---

### Critical Alert
**Triggers:** Error rate >15%, cost >90%, security incident, constitution violation
**Actions:**
- System freeze (all execution halted)
- Downgrade to L0
- Operator emergency notification
- GitHub issue auto-created
- War Room runbook execution
- Full system snapshot

**Response Time:** Immediate operator intervention required

---

## Model Selection Strategy

### Provider Priority (Cost-Optimized)
1. **Groq** (llama-3.3-70b-versatile) - Primary for BrainSmart reasoning
2. **OpenAI GPT-4** - Fallback for complex reasoning
3. **OpenAI GPT-3.5-turbo** - Emergency cost reduction
4. **Mock/Deterministic** - Zero-cost fallback

### Routing Rules
- **Cost < 50% budget:** Use Groq
- **Cost 50-80% budget:** Use GPT-3.5-turbo for non-critical tasks
- **Cost > 80% budget:** Force GPT-3.5-turbo for everything
- **Cost > 90% budget:** Mock only (or freeze)

### Token Limits
- **Default:** 8,000 tokens per request
- **Emergency:** 4,000 tokens per request
- **Critical:** 2,000 tokens per request

---

## Review & Audit

### Post-Build Review (All Levels)
**Required within 24 hours:**
- Receipt chain verification
- Cost actual vs. estimate comparison
- Error rate analysis
- Drift detection results
- Constitution compliance check

### Monthly Autonomy Review
**Required monthly:**
- Success rate by autonomy level
- Cost efficiency trends
- Error patterns
- Scope adherence
- Upgrade/downgrade recommendations

### Quarterly Policy Review
**Required quarterly:**
- Policy effectiveness assessment
- Threshold tuning recommendations
- New risk identification
- Constitution amendments if needed

---

## Testing & Validation

### Before Autonomy Level Increase
**Required tests:**
- 10+ successful builds at current level
- Error rate < threshold for 30 days
- Cost predictions accurate within margins
- Zero constitution violations
- War Room monitoring functional
- Runbooks tested

### Integration Test Suite
**Required passing:**
- `tests/integration/robby-build-l1.spec.ts`
- `tests/integration/robby-build-l2.spec.ts`
- `tests/integration/cost-caps.spec.ts`
- `tests/integration/scope-lock.spec.ts`
- `tests/integration/receipt-chain.spec.ts`

---

## Operator Commands

### Autonomy Management
```bash
# Check current level
robby autonomy status

# Manual upgrade (with safeguards)
robby autonomy upgrade 3 "Reason for upgrade"

# Manual downgrade
robby autonomy downgrade 1 "Reason for downgrade"

# Emergency kill switch
robby autonomy kill "Emergency reason"
```

### Build Commands
```bash
# Build with default autonomy level (L2)
robby build "Create a todo app with auth"

# Build with specific autonomy level
robby build "Create a todo app" --level 1

# Build with cost limit override
robby build "Create a SaaS app" --budget 10
```

### War Room Integration
```bash
# Check Robby health
war-room robby status

# View autonomy history
war-room robby history

# Review last build
war-room impact analyze <commit-sha>
```

---

## Fixtures & Test Data

### Standard Test Fixtures
1. **todo-app-with-auth** (scope-locked, simple)
   - Expected steps: 8
   - Expected cost: $2
   - Expected duration: 30 minutes

2. **stripe-saas** (complex, should trigger approval)
   - Expected steps: 24
   - Expected cost: $8 (exceeds L2 default, needs approval)
   - Expected duration: 2 hours

3. **sensor-app-ios** (iOS archetype test)
   - Expected steps: 15
   - Expected cost: $5
   - Expected duration: 1 hour

---

## Amendment Process

**To modify this policy:**
1. Create PR with "AUTONOMY-POLICY-AMENDMENT" label
2. Provide TruthSerum-verified justification
3. CODEOWNERS review required
4. 7-day review period (or expedited with 2+ operator approval)
5. Update version number
6. Document changes in CHANGELOG

---

**This policy implements CONSTITUTION.md Article II.**

*Effective: January 22, 2026*
*Next Review: April 22, 2026*
