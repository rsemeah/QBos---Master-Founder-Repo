// packages/delivery-kernel/src/types.ts

/**
 * Core types for Delivery Kernel v1
 * Orchestrates SDLC from intent → plan → build → release
 */

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4

export interface UserIntent {
  description: string
  type: 'web-app' | 'ios-app' | 'api' | 'service'
  constraints?: {
    budget?: number
    deadline?: string
    complexity?: 'simple' | 'moderate' | 'complex'
  }
  features?: string[]
}

export interface BuildPlan {
  id: string
  intent: UserIntent
  architecture: Architecture
  scope: Scope
  cost_estimate: CostEstimate
  timeline: Timeline
  sprints: Sprint[]
  created_at: string
  locked: boolean
}

export interface Architecture {
  type: 'web-app' | 'ios-app' | 'api' | 'service'
  archetype?: IOSArchetype
  tech_stack: TechStack
  engines_required: string[]
  capabilities: string[]
}

export type IOSArchetype =
  | 'auth-content-app'
  | 'saas-companion'
  | 'marketplace-lite'
  | 'sensor-app'
  | 'subscription-media'

export interface TechStack {
  frontend?: string
  backend?: string
  database?: string
  auth?: string
  payments?: string
  deployment?: string
}

export interface Scope {
  locked: boolean
  features: Feature[]
  out_of_scope: string[]
  acceptance_criteria: string[]
  charter_id?: string
}

export interface Feature {
  id: string
  name: string
  description: string
  priority: 'must-have' | 'should-have' | 'nice-to-have'
  complexity: 1 | 2 | 3 | 5 | 8 // Fibonacci points
  dependencies: string[]
}

export interface CostEstimate {
  llm_calls: number
  estimated_cost: number
  cost_breakdown: {
    brainsmart: number
    execution: number
    testing: number
    deployment: number
  }
  confidence: 'low' | 'medium' | 'high'
}

export interface Timeline {
  estimated_hours: number
  sprints_count: number
  start_date: string
  target_completion: string
}

export interface Sprint {
  id: string
  number: number
  goal: string
  features: string[] // Feature IDs
  duration_estimate: number
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  steps: ExecutionStep[]
}

export interface ExecutionStep {
  id: string
  type: 'analysis' | 'design' | 'implementation' | 'test' | 'deploy'
  engine: string
  description: string
  inputs: Record<string, any>
  outputs?: Record<string, any>
  receipt_id?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  error?: string
}

export interface BrainSmartContext {
  intent: UserIntent
  conversation_history: Message[]
  scope_lock?: Scope
  autonomy_level: AutonomyLevel
  budget_remaining: number
  previous_receipts: string[]
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface ReasoningResult {
  plan: BuildPlan
  reasoning: string
  confidence: number
  risks: Risk[]
  recommendations: string[]
}

export interface Risk {
  category: 'technical' | 'cost' | 'time' | 'scope'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation?: string
}

export interface ScrumArtifacts {
  product_backlog: BacklogItem[]
  sprint_backlogs: SprintBacklog[]
  definition_of_done: string[]
  retrospective_notes: string[]
}

export interface BacklogItem {
  id: string
  user_story: string
  acceptance_criteria: string[]
  story_points: number
  priority: number
  sprint?: number
}

export interface SprintBacklog {
  sprint_number: number
  items: BacklogItem[]
  capacity: number
  velocity_estimate: number
}

export interface ConstitutionalCheck {
  passed: boolean
  violations: string[]
  scope_valid: boolean
  cost_valid: boolean
  autonomy_valid: boolean
  recommendations: string[]
}

export interface ReleasePackage {
  build_id: string
  version: string
  type: 'web' | 'ios' | 'android' | 'api'
  artifacts: Artifact[]
  receipts: string[]
  changelog: string
  documentation: Documentation
  compliance: ComplianceReport
  ready_for_release: boolean
}

export interface Artifact {
  type: 'source' | 'bundle' | 'binary' | 'config'
  path: string
  hash: string
  size: number
}

export interface Documentation {
  readme: string
  api_docs?: string
  deployment_guide: string
  user_guide?: string
  architecture_diagram?: string
}

export interface ComplianceReport {
  ios_review_ready: boolean
  privacy_policy_included: boolean
  permissions_declared: string[]
  test_coverage: number
  security_scan_passed: boolean
  accessibility_checked: boolean
}

export interface DeliveryKernelState {
  current_build?: BuildPlan
  autonomy_level: AutonomyLevel
  active_sprint?: number
  paused: boolean
  error?: string
  receipts: string[]
}

export interface GroqConfig {
  api_key: string
  model: string
  max_tokens: number
  temperature: number
}

export interface IntakeResult {
  understood: boolean
  clarifications_needed: string[]
  initial_plan?: BuildPlan
  next_action: 'proceed' | 'clarify' | 'reject'
  rejection_reason?: string
}
