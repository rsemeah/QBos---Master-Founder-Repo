// packages/delivery-kernel/tests/integration/build-workflow.test.ts

/**
 * Integration tests for complete build workflow
 * Tests: Intent → BrainSmart → Scope Lock → Execution → Release
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrainSmart } from '../../src/brainsmart'
import { JourneysEngine } from '../../src/journeys'
import { EthosEngine } from '../../src/ethos'
import { ExecutionOrchestrator } from '../../src/orchestrator'
import { ReleaseEngine } from '../../src/release'
import type { UserIntent, AutonomyLevel } from '../../src/types'

describe('Delivery Kernel - Complete Build Workflow', () => {
  const sessionId = 'test-session-001'
  let brainSmart: BrainSmart
  let journeysEngine: JourneysEngine
  let ethosEngine: EthosEngine
  let orchestrator: ExecutionOrchestrator
  let releaseEngine: ReleaseEngine

  beforeEach(() => {
    brainSmart = new BrainSmart({
      api_key: '', // Empty = deterministic fallback
      model: 'llama-3.3-70b-versatile',
      max_tokens: 8000,
      temperature: 0.7
    })
    journeysEngine = new JourneysEngine()
    ethosEngine = new EthosEngine()
    orchestrator = new ExecutionOrchestrator()
    releaseEngine = new ReleaseEngine()
  })

  describe('Web App Build', () => {
    it('should build a simple web app from intent to release', async () => {
      // Step 1: User intent
      const intent: UserIntent = {
        description: 'Build a todo app with authentication',
        type: 'web-app',
        constraints: {
          budget: 5,
          complexity: 'simple'
        },
        features: ['User authentication', 'Todo CRUD', 'Todo filtering']
      }

      // Step 2: Generate build plan with BrainSmart
      const autonomyLevel: AutonomyLevel = 2
      const result = await brainSmart.analyzeIntent(intent, {
        autonomy_level: autonomyLevel,
        budget_remaining: 5
      }, sessionId)

      expect(result.plan).toBeDefined()
      expect(result.plan.intent).toEqual(intent)
      expect(result.plan.sprints.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)

      const plan = result.plan

      // Step 3: Lock scope with EthosEngine
      const lockedScope = await ethosEngine.lockScope(plan, sessionId)

      expect(lockedScope.locked).toBe(true)
      expect(lockedScope.features.length).toBeGreaterThan(0)

      // Step 4: Generate Scrum artifacts
      const scrumArtifacts = await journeysEngine.generateScrumArtifacts(plan, sessionId)

      expect(scrumArtifacts.product_backlog.length).toBeGreaterThan(0)
      expect(scrumArtifacts.sprint_backlogs.length).toBe(plan.sprints.length)

      // Step 5: Execute build plan
      const execution = await orchestrator.executePlan(plan, autonomyLevel, sessionId)

      expect(execution.success).toBe(true)
      expect(execution.steps_executed).toBeGreaterThan(0)
      expect(execution.receipts.length).toBeGreaterThan(0)
      expect(execution.cost_actual).toBeGreaterThan(0)

      // Step 6: Prepare release
      const artifacts = execution.artifacts.map(path => ({
        type: 'source' as const,
        path,
        hash: 'mock-hash',
        size: 1024
      }))

      const releasePackage = await releaseEngine.prepareRelease(
        plan,
        artifacts,
        sessionId
      )

      expect(releasePackage.ready_for_release).toBe(true)
      expect(releasePackage.compliance.ios_review_ready).toBe(true)
      expect(releasePackage.documentation.readme).toBeDefined()
    })
  })

  describe('iOS App Build - Auth Content App', () => {
    it('should build an iOS auth-content app', async () => {
      const intent: UserIntent = {
        description: 'Build an Instagram-like photo sharing app',
        type: 'ios-app',
        constraints: {
          budget: 10,
          complexity: 'moderate'
        },
        features: [
          'User authentication',
          'Photo feed',
          'User profiles',
          'Photo uploads',
          'Like and comment'
        ]
      }

      const result = await brainSmart.analyzeIntent(intent, {
        autonomy_level: 2,
        budget_remaining: 10
      }, sessionId)

      const plan = result.plan

      // Should detect iOS app archetype
      expect(plan.architecture.type).toBe('ios-app')
      expect(plan.architecture.archetype).toBe('auth-content-app')

      // Lock scope
      const lockedScope = await ethosEngine.lockScope(plan, sessionId)
      expect(lockedScope.locked).toBe(true)

      // Execute
      const execution = await orchestrator.executePlan(plan, 2, sessionId)
      expect(execution.success).toBe(true)

      // Prepare release
      const artifacts = execution.artifacts.map(path => ({
        type: 'source' as const,
        path,
        hash: 'mock-hash',
        size: 1024
      }))

      const releasePackage = await releaseEngine.prepareRelease(
        plan,
        artifacts,
        sessionId
      )

      // iOS-specific compliance checks
      expect(releasePackage.compliance.permissions_declared).toContain('Camera')
      expect(releasePackage.compliance.permissions_declared).toContain('Photo Library')
    })
  })

  describe('Constitutional Enforcement', () => {
    it('should enforce scope lock and prevent feature creep', async () => {
      const intent: UserIntent = {
        description: 'Build a simple note-taking app',
        type: 'web-app',
        features: ['Create notes', 'Edit notes', 'Delete notes']
      }

      const result = await brainSmart.analyzeIntent(intent, {
        autonomy_level: 2,
        budget_remaining: 5
      }, sessionId)

      const plan = result.plan

      // Lock scope
      const lockedScope = await ethosEngine.lockScope(plan, sessionId)
      expect(lockedScope.locked).toBe(true)

      // Try to add feature after lock (should be blocked)
      const check = await ethosEngine.validateOperation(
        'add_feature: Real-time collaboration',
        {
          scope_locked: true,
          cost_estimate: plan.cost_estimate.estimated_cost,
          autonomy_level: 2,
          budget_remaining: 5
        },
        sessionId
      )

      expect(check.passed).toBe(false)
      expect(check.violations).toContain('Scope is locked - cannot add features')
    })

    it('should enforce cost limits', async () => {
      const intent: UserIntent = {
        description: 'Build a complex enterprise SaaS platform',
        type: 'web-app',
        constraints: {
          budget: 5 // Too low for enterprise app
        }
      }

      const result = await brainSmart.analyzeIntent(intent, {
        autonomy_level: 2,
        budget_remaining: 5
      }, sessionId)

      const plan = result.plan

      // Check if cost exceeds budget
      const check = await ethosEngine.validateOperation(
        'execute_plan',
        {
          scope_locked: false,
          cost_estimate: plan.cost_estimate.estimated_cost,
          autonomy_level: 2,
          budget_remaining: 5
        },
        sessionId
      )

      if (plan.cost_estimate.estimated_cost > 5) {
        expect(check.passed).toBe(false)
        expect(check.violations.some(v => v.includes('Cost'))).toBe(true)
      }
    })
  })

  describe('Receipt Generation', () => {
    it('should generate receipts at every step', async () => {
      const intent: UserIntent = {
        description: 'Build a simple landing page',
        type: 'web-app',
        features: ['Hero section', 'Contact form']
      }

      const result = await brainSmart.analyzeIntent(intent, {
        autonomy_level: 2,
        budget_remaining: 5
      }, sessionId)

      const plan = result.plan

      // Each operation should emit receipts
      await ethosEngine.lockScope(plan, sessionId)
      await journeysEngine.generateScrumArtifacts(plan, sessionId)
      const execution = await orchestrator.executePlan(plan, 2, sessionId)

      // Check receipts were generated
      expect(execution.receipts.length).toBeGreaterThan(0)

      // In production, would verify receipts in TruthSerum database
    })
  })
})
