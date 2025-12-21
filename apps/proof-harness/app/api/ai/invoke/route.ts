import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface AIInvokeBody {
  prompt: string
  userId?: string
  orgId?: string
  mode?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: AIInvokeBody = await request.json()

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json({
        ok: false,
        error: 'prompt is required',
      }, { status: 400 })
    }

    // Check if consent is required
    const consentRequired = process.env.CONSENT_REQUIRED === 'true'
    if (consentRequired && !body.userId) {
      return NextResponse.json({
        ok: false,
        errorType: 'consent_required',
        error: 'userId is required when CONSENT_REQUIRED=true',
      }, { status: 400 })
    }

    // Emit AIInvokeRequested event to SightEngine (non-blocking)
    emitSightEngineEvent('AIInvokeRequested', {
      userId: body.userId,
      orgId: body.orgId,
      mode: body.mode,
      promptLength: body.prompt.length,
    })

    // Pre-safety check via SafetyEngine (if available)
    const preSafetyCheck = await runSafetyCheck(body.prompt, 'input')
    if (!preSafetyCheck.passed) {
      return NextResponse.json({
        ok: false,
        errorType: 'safety_violation',
        error: 'Content violates safety policies',
        violations: preSafetyCheck.violations,
        latencyMs: Date.now() - startTime,
      }, { status: 400 })
    }

    // Invoke AI via SilentEngine (with provider selection)
    const aiResult = await invokeAI(body.prompt, body.mode)

    if (!aiResult.ok) {
      return NextResponse.json({
        ok: false,
        error: aiResult.error,
        latencyMs: Date.now() - startTime,
      }, { status: 500 })
    }

    // Post-safety check on output
    const postSafetyCheck = await runSafetyCheck(aiResult.output || '', 'output')
    if (!postSafetyCheck.passed) {
      return NextResponse.json({
        ok: false,
        errorType: 'output_safety_violation',
        error: 'AI output violates safety policies',
        violations: postSafetyCheck.violations,
        latencyMs: Date.now() - startTime,
      }, { status: 400 })
    }

    const latencyMs = Date.now() - startTime

    // Emit AIInvokeCompleted event (non-blocking)
    emitSightEngineEvent('AIInvokeCompleted', {
      userId: body.userId,
      orgId: body.orgId,
      provider: aiResult.provider,
      model: aiResult.model,
      latencyMs,
      cost: aiResult.cost,
    })

    return NextResponse.json({
      ok: true,
      provider: aiResult.provider,
      model: aiResult.model,
      latencyMs,
      cost: aiResult.cost,
      output: aiResult.output,
      safetyChecks: {
        input: preSafetyCheck.passed,
        output: postSafetyCheck.passed,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      latencyMs: Date.now() - startTime,
    }, { status: 500 })
  }
}

/**
 * Run safety check on content (stub for SafetyEngine integration)
 */
async function runSafetyCheck(content: string, type: 'input' | 'output'): Promise<{
  passed: boolean
  violations?: string[]
}> {
  try {
    // SafetyEngine integration would go here
    // For now, basic keyword check as placeholder
    const dangerousPatterns = [
      /\bhate\b/i,
      /\bviolence\b/i,
      /\bexplicit\b/i,
    ]

    const violations: string[] = []
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        violations.push(`Matched pattern: ${pattern}`)
      }
    }

    const passed = violations.length === 0

    console.log(`[SafetyEngine] ${type} safety check:`, { passed, violations })

    return { passed, violations: violations.length > 0 ? violations : undefined }
  } catch (error) {
    console.error('[SafetyEngine] Safety check failed (allowing through):', error)
    // Fail open - don't block on safety check errors
    return { passed: true }
  }
}

/**
 * Invoke AI provider (stub for SilentEngine integration)
 */
async function invokeAI(prompt: string, mode?: string): Promise<{
  ok: boolean
  error?: string
  provider?: string
  model?: string
  cost?: number
  output?: string
}> {
  try {
    // Check for API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    const googleKey = process.env.GOOGLE_API_KEY

    if (!anthropicKey && !openaiKey && !googleKey) {
      return {
        ok: false,
        error: 'No AI provider API keys configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY',
      }
    }

    // SilentEngine would handle routing here
    // For proof harness, we'll simulate a response
    const provider = anthropicKey ? 'anthropic' : openaiKey ? 'openai' : 'google'
    const model = provider === 'anthropic' ? 'claude-3-haiku' : provider === 'openai' ? 'gpt-4' : 'gemini-pro'

    // Simulate AI response
    const output = `[Simulated ${provider} response to: "${prompt.slice(0, 50)}..."]`

    console.log(`[SilentEngine] AI invoked:`, { provider, model, mode })

    return {
      ok: true,
      provider,
      model,
      cost: 0.001, // Simulated cost
      output,
    }
  } catch (error: any) {
    return {
      ok: false,
      error: error.message,
    }
  }
}

/**
 * Emit event to SightEngine (non-blocking)
 */
function emitSightEngineEvent(eventName: string, properties: Record<string, any>): void {
  // Non-blocking event emission
  setImmediate(() => {
    try {
      console.log(`[SightEngine] Event:`, {
        eventName,
        properties,
        timestamp: new Date().toISOString(),
      })
      // In production, this would call SightEngine.track()
    } catch (error) {
      console.error('[SightEngine] Event emission failed (non-blocking):', error)
    }
  })
}
