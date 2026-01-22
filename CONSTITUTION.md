# QuietBuild OS Constitution

**Version:** 1.0.0
**Last Updated:** January 22, 2026
**Authority:** Founding Document - Immutable Core Principles

---

## Preamble

This Constitution establishes the **non-negotiable rules** that govern all operations within QuietBuild OS. No component, engine, agent, or human operator may violate these principles. All system behavior must be **provable, auditable, and receipt-backed**.

---

## Article I: Truth & Proof

### Section 1.1: No Claims Without Proof
**Rule:** No system may claim an action completed without a corresponding TruthSerum receipt.

**Enforcement:**
- All engine outputs must include receipt IDs
- All API responses must be sanitized of unproven claims
- CI/CD TruthGate blocks merges with unverified claims

**Violations:** System freeze + operator alert

### Section 1.2: Receipt Chain of Custody
**Rule:** All receipts must form an unbroken parent-child chain from intent to completion.

**Enforcement:**
- ReceiptWriter generates parent references
- War Room verifies receipt continuity
- Gaps trigger drift alerts

**Violations:** Receipt chain break = deployment blocked

### Section 1.3: Immutability
**Rule:** Once written, receipts cannot be modified or deleted.

**Enforcement:**
- Receipts stored with EdDSA signatures
- Keystore verification required
- Supabase RLS policies prevent deletion

**Violations:** Security incident + audit trail review

---

## Article II: Autonomy & Safety

### Section 2.1: Autonomy Levels

**Level 0 - Manual Only**
- Robby PA does nothing autonomously
- All actions require explicit human approval
- Read-only access to system state

**Level 1 - Read-Only Analysis**
- Robby can analyze, suggest, recommend
- No execution permitted
- Output: Reports, recommendations, impact analysis

**Level 2 - Guided Execution**
- Robby can execute with step-by-step human approval
- Each step requires confirmation
- Human can abort at any stage

**Level 3 - Semi-Autonomous**
- Robby can build complete applications
- Human review required before release/deployment
- Automatic rollback on errors

**Level 4 - Full Autonomy**
- Robby can build, test, and release automatically
- Post-facto review and receipts
- War Room monitoring with auto-downgrade on issues

### Section 2.2: Autonomy Downgrade Triggers

**Automatic Downgrade to Level 1:**
- Error rate > 10% over 1 hour
- Cost exceeds 80% of monthly budget
- Drift detection: critical severity
- 3+ failed deployments in 24 hours
- Human interrupt > 10 times in 1 hour

**Automatic Downgrade to Level 0 (Kill Switch):**
- Cost exceeds 95% of monthly budget
- Security incident detected
- Constitution violation detected
- Operator manual override
- System freeze activated

### Section 2.3: Escalation Policy

**Yellow Alert (Autonomy Level 2 → 1):**
- War Room notification
- Operator email (non-urgent)
- Continue monitoring

**Red Alert (Autonomy Level 1 → 0):**
- War Room critical notification
- Operator SMS/page
- System log snapshot
- All pending operations cancelled

**Critical Alert (System Freeze):**
- All operations halted immediately
- Operator emergency contact
- GitHub issue created automatically
- War Room runbook execution

---

## Article III: Scope & Boundaries

### Section 3.1: Hard Scope Lock
**Rule:** Once EthosEngine locks scope for a build, no features may be added without explicit charter amendment.

**Enforcement:**
- EthosEngine validates all execution requests against locked scope
- Delivery Kernel rejects out-of-scope steps
- BrainSmart reasoning constrained to approved features

**Violations:** Build termination + scope violation receipt

### Section 3.2: Feature Creep Prevention
**Rule:** AI reasoning (BrainSmart) may NOT suggest features beyond locked scope.

**Enforcement:**
- Scope lock embedded in Groq prompts
- JourneysEngine sprint plans validated against charter
- Execution Orchestrator checks scope before engine invocation

**Violations:** AI downgrade + human review required

### Section 3.3: Budget Scope Alignment
**Rule:** Cost estimates must be provided before scope lock. Actual cost may not exceed estimate by >20%.

**Enforcement:**
- War Room cost monitoring
- BrainSmart generates cost estimates per feature
- Execution halts at 120% of estimate

**Violations:** Cost overrun alert + operator approval required

---

## Article IV: Cost & Resource Governance

### Section 4.1: Monthly Budget Cap
**Default:** $1,000/month
**Kill Threshold:** $1,100/month (110% of budget)
**Warning Threshold:** $800/month (80% of budget)

**Enforcement:**
- War Room cost monitoring
- Automatic routing override to cheaper models at 80%
- Automatic system freeze at 95%
- Hard kill at 110%

### Section 4.2: Model Selection Priority
**Hierarchy:**
1. Groq (llama-3.3-70b-versatile) - Primary for BrainSmart
2. OpenAI GPT-4 - Fallback for critical reasoning
3. OpenAI GPT-3.5-turbo - Emergency cost reduction
4. Local/deterministic fallbacks - Zero cost option

**Enforcement:**
- War Room routing override when budget at risk
- Cost-per-invocation tracking
- SilentEngine model selection based on task complexity

### Section 4.3: Cost Transparency
**Rule:** All LLM invocations must log cost with receipts.

**Enforcement:**
- SilentEngine emits cost receipts
- War Room aggregates spend
- Real-time budget remaining displayed

**Violations:** Cost tracking failure = LLM usage suspended

---

## Article V: Apple App Store Compliance

### Section 5.1: Privacy by Default
**Rule:** All iOS apps must include privacy policy and required permission strings.

**Enforcement:**
- iOS template includes privacy policy placeholder
- Capability adapters include purpose strings
- Review readiness checklist before build

**Violations:** Build blocked until compliance added

### Section 5.2: App Review Readiness
**Rule:** No iOS build may proceed to TestFlight without review readiness verification.

**Requirements:**
- No placeholder content
- No broken features
- All required permissions declared
- Privacy nutrition labels complete
- Crash-free test runs

**Enforcement:**
- ReleaseEngine checklist
- Automated UI tests pass
- Receipt proving all checks passed

### Section 5.3: App Archetypes
**Approved Archetypes:** (Robby may only build from these templates)
1. Auth + Content App (feeds, profiles, bookmarks)
2. SaaS Companion App (account, billing, notifications)
3. Marketplace-Lite (listings, messaging, payments)
4. Sensor App (camera/location/mic + uploads)
5. Subscription Media App (IAP, paywalls, playback)

**Enforcement:**
- BrainSmart must map user intent to archetype
- JourneysEngine generates archetype-specific sprints
- Execution Orchestrator uses archetype templates

**Violations:** Build rejected + human clarification required

---

## Article VI: Human Oversight

### Section 6.1: Human-in-the-Loop Gates

**Required Human Approval:**
- Autonomy Level < 3: Every execution step
- Autonomy Level 3: Before deployment
- Cost > 50% of monthly budget: Before continuing
- Scope change requests: Always
- Constitution amendment: Always

### Section 6.2: Operator Override
**Rule:** Human operators may override any autonomous decision at any time.

**Enforcement:**
- `war-room freeze emergency "<reason>"` - Immediate halt
- `robby` commands always have priority
- War Room controls supersede all automation

### Section 6.3: Audit & Review
**Rule:** All autonomous operations must be reviewable post-facto.

**Enforcement:**
- Complete receipt chain stored
- War Room impact analysis available
- Drift detection runs nightly
- Monthly autonomy performance review

---

## Article VII: Security & Secrets

### Section 7.1: Secret Management
**Rule:** API keys, tokens, and credentials never appear in code, logs, or receipts.

**Enforcement:**
- Environment variables only
- Receipt redaction for sensitive fields
- No secrets in git commits
- Secrets rotation policy (90 days)

### Section 7.2: RLS & Access Control
**Rule:** All database operations enforce Row Level Security.

**Enforcement:**
- Supabase RLS policies on all tables
- Identity Engine manages authentication
- War Room tables operator-only access

### Section 7.3: Receipt Signing
**Rule:** All receipts must be cryptographically signed.

**Enforcement:**
- EdDSA signatures via keystore
- Signature verification before trust
- Key rotation via `robby rotate-key`

---

## Article VIII: CI/CD & Quality Gates

### Section 8.1: TruthGate Enforcement
**Rule:** No merge to main without TruthGate passing.

**Enforcement:**
- GitHub branch protection
- TruthGate workflow must pass
- All CI checks green required

### Section 8.2: Regression Protection
**Rule:** Nightly regression tests must pass before next build.

**Enforcement:**
- War Room nightly regression workflow
- Auto-issue creation on failure
- Robby downgrade if regressions fail

### Section 8.3: Receipt Coverage
**Rule:** All engine operations must emit receipts.

**Enforcement:**
- Execution Engine tracks receipt count
- War Room validates receipt continuity
- Missing receipts = build blocked

---

## Article IX: Documentation & Knowledge

### Section 9.1: Real-Time Documentation
**Rule:** Documentation must be generated as code is written, not after.

**Enforcement:**
- Delivery Kernel Documentation Generator
- Every sprint generates docs
- README updates included in release

### Section 9.2: Receipt-Based Changelog
**Rule:** All releases include changelog generated from receipts.

**Enforcement:**
- Release Gate aggregates receipts
- Semantic versioning based on changes
- Changelog emitted with deployment

---

## Article X: Amendments & Governance

### Section 10.1: Amendment Process
**Rule:** Constitution amendments require human approval + 7-day review period.

**Enforcement:**
- Pull request with "CONSTITUTION-AMENDMENT" label
- Mandatory review by all CODEOWNERS
- War Room runbook for amendment process

### Section 10.2: Emergency Amendments
**Rule:** In critical situations, amendments may be expedited with operator override.

**Requirements:**
- Critical security issue
- System-wide failure
- Regulatory requirement
- 2+ operator approval

---

## Article XI: Enforcement & Violations

### Section 11.1: Violation Severity

**Minor Violations** (Warning):
- Missing receipt (non-critical operation)
- Style guide deviation
- Documentation lag

**Major Violations** (Downgrade):
- Scope creep attempt
- Cost threshold exceeded
- Regression failure

**Critical Violations** (Freeze):
- Constitution breach
- Security incident
- Data loss
- Unverified deployment

### Section 11.2: Remediation
**Process:**
1. War Room detects violation
2. Appropriate runbook executes
3. Operator notified
4. Violation logged with receipt
5. System restored to compliant state
6. Post-mortem within 24 hours

---

## Appendix A: Glossary

**TruthSerum:** Constitutional proof system ensuring no claims without receipts.

**War Room:** Operations control plane for monitoring, alerting, and emergency response.

**Delivery Kernel:** SDLC orchestration system coordinating all builds.

**BrainSmart:** AI reasoning engine using Groq for intent analysis and planning.

**JourneysEngine:** Sprint and Scrum generation system.

**EthosEngine:** Constitutional enforcement layer with hard scope lock.

**Robby PA:** Autonomous conductor agent with 5 autonomy levels.

**Receipt:** Immutable proof artifact of completed operation.

**Scope Lock:** Immutable feature set agreed before build begins.

**Autonomy Level:** 0-4 scale of Robby's decision-making authority.

---

## Appendix B: Contact & Escalation

**War Room Alerts:** Logged to GitHub issues + operator notifications

**Critical Incidents:** SMS/page to on-call operator

**Autonomy Decisions:** Logged with receipts, reviewable in War Room

**Constitution Questions:** Open GitHub discussion with "constitution" label

---

**This Constitution is the law of QuietBuild OS. All systems must comply.**

*Signed: System Bootstrap*
*Date: January 22, 2026*
