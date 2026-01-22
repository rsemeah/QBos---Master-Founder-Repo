// packages/delivery-kernel/src/brainsmart/index.ts

/**
 * BrainSmart - AI Reasoning Engine with Groq Integration
 *
 * Constitutional Constraints:
 * - Must respect scope lock (no feature suggestions outside scope)
 * - Cost estimates required before plan finalization
 * - Adaptive context management (prioritize recent changes)
 * - All reasoning must be receipt-backed
 */

import { ReceiptWriter } from '@qbos/truthserum'
import type {
  UserIntent,
  BuildPlan,
  BrainSmartContext,
  ReasoningResult,
  Risk,
  Architecture,
  Scope,
  Feature,
  Sprint,
  GroqConfig,
  CostEstimate,
  Timeline
} from '../types.js'

export class BrainSmart {
  private config: GroqConfig
  private contextWindow: number = 128000 // Groq context limit

  constructor(config?: Partial<GroqConfig>) {
    this.config = {
      api_key: config?.api_key || process.env.GROQ_API_KEY || '',
      model: config?.model || 'llama-3.3-70b-versatile',
      max_tokens: config?.max_tokens || 8000,
      temperature: config?.temperature || 0.7
    }
  }

  /**
   * Analyze user intent and generate initial build plan
   */
  async analyzeIntent(intent: UserIntent, context: Partial<BrainSmartContext> = {}): Promise<ReasoningResult> {
    const sessionId = `brainsmart-${Date.now()}`

    // Validate configuration
    if (!this.config.api_key) {
      console.warn('GROQ_API_KEY not set - using deterministic fallback')
      return this.deterministicFallback(intent)
    }

    try {
      // Build context for Groq
      const fullContext: BrainSmartContext = {
        intent,
        conversation_history: context.conversation_history || [],
        scope_lock: context.scope_lock,
        autonomy_level: context.autonomy_level || 2,
        budget_remaining: context.budget_remaining || 1000,
        previous_receipts: context.previous_receipts || []
      }

      // Generate prompt with constitutional constraints
      const prompt = this.buildReasoningPrompt(fullContext)

      // Call Groq API
      const response = await this.invokeGroq(prompt, sessionId)

      // Parse response into BuildPlan
      const plan = this.parsePlanFromResponse(response, intent)

      // Perform risk analysis
      const risks = this.analyzeRisks(plan, fullContext)

      // Generate recommendations
      const recommendations = this.generateRecommendations(plan, risks, fullContext)

      const result: ReasoningResult = {
        plan,
        reasoning: response,
        confidence: this.calculateConfidence(plan, risks),
        risks,
        recommendations
      }

      // Emit receipt
      await ReceiptWriter.write({
        sessionId,
        type: 'brainsmart.analysis.completed',
        details: {
          intent: intent.description,
          plan_id: plan.id,
          confidence: result.confidence,
          risks_count: risks.length,
          cost_estimate: plan.cost_estimate.estimated_cost
        }
      })

      return result

    } catch (error) {
      console.error('BrainSmart analysis failed:', error)

      // Emit error receipt
      await ReceiptWriter.write({
        sessionId,
        type: 'brainsmart.analysis.failed',
        details: {
          intent: intent.description,
          error: error instanceof Error ? error.message : String(error)
        }
      })

      // Fall back to deterministic plan
      return this.deterministicFallback(intent)
    }
  }

  /**
   * Refine existing plan based on feedback or scope changes
   */
  async refinePlan(
    currentPlan: BuildPlan,
    feedback: string,
    context: Partial<BrainSmartContext> = {}
  ): Promise<ReasoningResult> {
    const sessionId = `brainsmart-refine-${Date.now()}`

    // If scope is locked, reject refinements that add features
    if (currentPlan.scope.locked && this.addsFeatures(feedback, currentPlan)) {
      return {
        plan: currentPlan,
        reasoning: 'Scope is locked. Cannot add features. Request charter amendment to proceed.',
        confidence: 1.0,
        risks: [{
          category: 'scope',
          severity: 'critical',
          description: 'Attempted scope change on locked plan',
          mitigation: 'Amend charter via EthosEngine'
        }],
        recommendations: ['Request formal scope amendment', 'Review constitutional constraints']
      }
    }

    // Adaptive context: prioritize recent feedback
    const refinementPrompt = this.buildRefinementPrompt(currentPlan, feedback, context)

    try {
      const response = await this.invokeGroq(refinementPrompt, sessionId)
      const refinedPlan = this.parsePlanFromResponse(response, currentPlan.intent)

      // Preserve locked scope if applicable
      if (currentPlan.scope.locked) {
        refinedPlan.scope = currentPlan.scope
      }

      const risks = this.analyzeRisks(refinedPlan, context as BrainSmartContext)
      const recommendations = this.generateRecommendations(refinedPlan, risks, context as BrainSmartContext)

      await ReceiptWriter.write({
        sessionId,
        type: 'brainsmart.refinement.completed',
        details: {
          original_plan_id: currentPlan.id,
          refined_plan_id: refinedPlan.id,
          feedback,
          scope_locked: currentPlan.scope.locked
        }
      })

      return {
        plan: refinedPlan,
        reasoning: response,
        confidence: this.calculateConfidence(refinedPlan, risks),
        risks,
        recommendations
      }

    } catch (error) {
      console.error('BrainSmart refinement failed:', error)
      return {
        plan: currentPlan,
        reasoning: `Refinement failed: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0,
        risks: [],
        recommendations: ['Retry with simplified feedback', 'Contact operator']
      }
    }
  }

  /**
   * Adaptive context management - prioritize recent/relevant information
   */
  private pruneContext(context: BrainSmartContext): BrainSmartContext {
    // Keep only last 10 conversation turns
    const recentHistory = context.conversation_history.slice(-10)

    // Keep only last 20 receipts
    const recentReceipts = context.previous_receipts.slice(-20)

    return {
      ...context,
      conversation_history: recentHistory,
      previous_receipts: recentReceipts
    }
  }

  /**
   * Build prompt for initial intent analysis
   */
  private buildReasoningPrompt(context: BrainSmartContext): string {
    const { intent, scope_lock, budget_remaining, autonomy_level } = context

    return `You are BrainSmart, the AI reasoning engine for QuietBuild OS. Analyze this user intent and generate a detailed build plan.

CONSTITUTIONAL CONSTRAINTS:
- If scope is locked, you CANNOT suggest new features
- All cost estimates must be provided
- Budget remaining: $${budget_remaining}
- Autonomy level: ${autonomy_level}
- You must respect the QuietBuild OS Constitution

USER INTENT:
Type: ${intent.type}
Description: ${intent.description}
Features Requested: ${intent.features?.join(', ') || 'Not specified'}

${intent.constraints ? `CONSTRAINTS:
Budget: $${intent.constraints.budget || 'Not specified'}
Deadline: ${intent.constraints.deadline || 'Not specified'}
Complexity: ${intent.constraints.complexity || 'Not specified'}
` : ''}

${scope_lock ? `SCOPE LOCK ACTIVE:
Locked Features: ${scope_lock.features.map((f: Feature) => f.name).join(', ')}
Out of Scope: ${scope_lock.out_of_scope.join(', ')}
YOU MAY NOT SUGGEST FEATURES OUTSIDE THIS SCOPE.
` : ''}

TASK:
1. Analyze the intent and determine if it's achievable
2. Map to an iOS archetype if type is "ios-app" (auth-content-app, saas-companion, marketplace-lite, sensor-app, subscription-media)
3. Break down into features with complexity estimates (Fibonacci: 1, 2, 3, 5, 8)
4. Generate 2-4 sprints with clear goals
5. Estimate LLM costs and total budget
6. Identify risks and provide recommendations

OUTPUT FORMAT (JSON):
{
  "architecture": {
    "type": "web-app" | "ios-app" | "api" | "service",
    "archetype": "..." (if iOS),
    "tech_stack": {...},
    "engines_required": [...],
    "capabilities": [...]
  },
  "features": [
    {
      "name": "...",
      "description": "...",
      "priority": "must-have" | "should-have" | "nice-to-have",
      "complexity": 1-8,
      "dependencies": [...]
    }
  ],
  "sprints": [
    {
      "number": 1,
      "goal": "...",
      "features": [...feature names],
      "duration_estimate": hours
    }
  ],
  "cost_estimate": {
    "llm_calls": number,
    "estimated_cost": number,
    "breakdown": {...}
  },
  "risks": [
    {
      "category": "technical|cost|time|scope",
      "severity": "low|medium|high|critical",
      "description": "...",
      "mitigation": "..."
    }
  ]
}

Generate the plan now:`
  }

  /**
   * Build prompt for plan refinement
   */
  private buildRefinementPrompt(
    currentPlan: BuildPlan,
    feedback: string,
    context: Partial<BrainSmartContext>
  ): string {
    return `You are BrainSmart. Refine this existing build plan based on user feedback.

CURRENT PLAN:
${JSON.stringify(currentPlan, null, 2)}

USER FEEDBACK:
${feedback}

${currentPlan.scope.locked ? `
⚠️ SCOPE IS LOCKED - YOU MAY NOT ADD NEW FEATURES
You can only adjust:
- Implementation details
- Timeline estimates
- Technical approach
- Risk mitigation strategies
` : ''}

Provide refined plan in the same JSON format as before.`
  }

  /**
   * Invoke Groq API
   */
  private async invokeGroq(prompt: string, sessionId: string): Promise<string> {
    if (!this.config.api_key) {
      throw new Error('GROQ_API_KEY not configured')
    }

    // TODO: Implement actual Groq API call
    // For now, return structured response
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.max_tokens,
        temperature: this.config.temperature
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data: any = await response.json()
    return data.choices[0].message.content
  }

  /**
   * Parse Groq response into BuildPlan
   */
  private parsePlanFromResponse(response: string, intent: UserIntent): BuildPlan {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Construct BuildPlan
      const planId = `plan-${Date.now()}`

      const features: Feature[] = (parsed.features || []).map((f: { name: string; description?: string; priority?: string; complexity?: number; dependencies?: string[] }, idx: number) => ({
        id: `feat-${idx + 1}`,
        name: f.name,
        description: f.description,
        priority: f.priority || 'should-have',
        complexity: f.complexity || 3,
        dependencies: f.dependencies || []
      }))

      const sprints: Sprint[] = (parsed.sprints || []).map((s: { number: number; goal: string; features?: string[]; duration_estimate?: number }) => ({
        id: `sprint-${s.number}`,
        number: s.number,
        goal: s.goal,
        features: s.features || [],
        duration_estimate: s.duration_estimate || 8,
        status: 'pending',
        steps: []
      }))

      const costEstimate: CostEstimate = parsed.cost_estimate || {
        llm_calls: 100,
        estimated_cost: 50,
        cost_breakdown: {
          brainsmart: 10,
          execution: 30,
          testing: 5,
          deployment: 5
        },
        confidence: 'medium'
      }

      const timeline: Timeline = {
        estimated_hours: sprints.reduce((sum: number, s: Sprint) => sum + s.duration_estimate, 0),
        sprints_count: sprints.length,
        start_date: new Date().toISOString(),
        target_completion: new Date(Date.now() + sprints.length * 7 * 24 * 60 * 60 * 1000).toISOString()
      }

      return {
        id: planId,
        intent,
        architecture: parsed.architecture,
        scope: {
          locked: false,
          features,
          out_of_scope: [],
          acceptance_criteria: features.map(f => `${f.name} works as described`)
        },
        cost_estimate: costEstimate,
        timeline,
        sprints,
        created_at: new Date().toISOString(),
        locked: false
      }

    } catch (error) {
      console.error('Failed to parse Groq response:', error)
      throw new Error(`Parse failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Analyze risks in the plan
   */
  private analyzeRisks(plan: BuildPlan, context: Partial<BrainSmartContext>): Risk[] {
    const risks: Risk[] = []

    // Cost risk
    if (plan.cost_estimate.estimated_cost > (context.budget_remaining || 1000)) {
      risks.push({
        category: 'cost',
        severity: 'critical',
        description: `Estimated cost ($${plan.cost_estimate.estimated_cost}) exceeds budget ($${context.budget_remaining})`,
        mitigation: 'Reduce scope or increase budget'
      })
    }

    // Complexity risk
    const totalComplexity = plan.scope.features.reduce((sum: number, f: Feature) => sum + f.complexity, 0)
    if (totalComplexity > 40) {
      risks.push({
        category: 'scope',
        severity: 'high',
        description: 'Total complexity very high - may require multiple iterations',
        mitigation: 'Split into phases or reduce scope'
      })
    }

    // Timeline risk
    if (plan.timeline.estimated_hours > 100) {
      risks.push({
        category: 'time',
        severity: 'medium',
        description: 'Estimated timeline exceeds 100 hours',
        mitigation: 'Consider parallel work streams or scope reduction'
      })
    }

    return risks
  }

  /**
   * Generate recommendations based on plan and risks
   */
  private generateRecommendations(
    plan: BuildPlan,
    risks: Risk[],
    context: Partial<BrainSmartContext>
  ): string[] {
    const recommendations: string[] = []

    // Budget recommendations
    if (plan.cost_estimate.estimated_cost > (context.budget_remaining || 1000) * 0.8) {
      recommendations.push('Consider routing override to cheaper models for non-critical operations')
    }

    // Scope recommendations
    if (plan.scope.features.filter((f: Feature) => f.priority === 'must-have').length > 10) {
      recommendations.push('Large number of must-have features - consider MVP approach')
    }

    // Risk-based recommendations
    const criticalRisks = risks.filter(r => r.severity === 'critical')
    if (criticalRisks.length > 0) {
      recommendations.push('Address critical risks before proceeding with build')
    }

    return recommendations
  }

  /**
   * Calculate confidence score for the plan
   */
  private calculateConfidence(plan: BuildPlan, risks: Risk[]): number {
    let confidence = 1.0

    // Reduce confidence for each risk
    risks.forEach(risk => {
      switch (risk.severity) {
        case 'critical': confidence -= 0.3; break
        case 'high': confidence -= 0.15; break
        case 'medium': confidence -= 0.05; break
        case 'low': confidence -= 0.02; break
      }
    })

    // Reduce confidence for incomplete information
    if (!plan.architecture.tech_stack) confidence -= 0.1
    if (plan.scope.features.length === 0) confidence -= 0.2

    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Check if feedback adds new features
   */
  private addsFeatures(feedback: string, currentPlan: BuildPlan): boolean {
    const featureKeywords = ['add', 'include', 'also', 'plus', 'need', 'want', 'require', 'should have']
    const feedbackLower = feedback.toLowerCase()

    return featureKeywords.some(keyword => feedbackLower.includes(keyword))
  }

  /**
   * Deterministic fallback when Groq unavailable
   */
  private deterministicFallback(intent: UserIntent): ReasoningResult {
    const planId = `plan-fallback-${Date.now()}`

    const plan: BuildPlan = {
      id: planId,
      intent,
      architecture: {
        type: intent.type,
        tech_stack: this.getDefaultTechStack(intent.type),
        engines_required: ['ExecutionEngine', 'IdentityEngine'],
        capabilities: []
      },
      scope: {
        locked: false,
        features: [{
          id: 'feat-1',
          name: 'Basic Setup',
          description: 'Initial project structure',
          priority: 'must-have',
          complexity: 3,
          dependencies: []
        }],
        out_of_scope: [],
        acceptance_criteria: ['Project builds successfully']
      },
      cost_estimate: {
        llm_calls: 50,
        estimated_cost: 25,
        cost_breakdown: {
          brainsmart: 5,
          execution: 15,
          testing: 3,
          deployment: 2
        },
        confidence: 'low'
      },
      timeline: {
        estimated_hours: 8,
        sprints_count: 1,
        start_date: new Date().toISOString(),
        target_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      sprints: [{
        id: 'sprint-1',
        number: 1,
        goal: 'Setup and basic functionality',
        features: ['feat-1'],
        duration_estimate: 8,
        status: 'pending',
        steps: []
      }],
      created_at: new Date().toISOString(),
      locked: false
    }

    return {
      plan,
      reasoning: 'Fallback plan generated (Groq unavailable)',
      confidence: 0.5,
      risks: [{
        category: 'technical',
        severity: 'medium',
        description: 'Using deterministic fallback - plan may lack detail',
        mitigation: 'Configure GROQ_API_KEY for AI-powered planning'
      }],
      recommendations: ['Add GROQ_API_KEY to environment', 'Review and refine plan manually']
    }
  }

  /**
   * Get default tech stack for app type
   */
  private getDefaultTechStack(type: string): any {
    switch (type) {
      case 'ios-app':
        return {
          frontend: 'React Native + Expo',
          backend: 'Next.js API',
          database: 'Supabase',
          auth: 'Supabase Auth',
          deployment: 'EAS Build + TestFlight'
        }
      case 'web-app':
        return {
          frontend: 'Next.js + React',
          backend: 'Next.js API Routes',
          database: 'Supabase',
          auth: 'NextAuth.js',
          deployment: 'Vercel'
        }
      default:
        return {
          backend: 'Node.js',
          database: 'PostgreSQL',
          deployment: 'Docker'
        }
    }
  }
}
