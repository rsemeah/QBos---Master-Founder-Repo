// packages/shared/safety-middleware/src/index.ts

/**
 * SafetyMiddleware - Shared safety checks for all engines
 *
 * Provides:
 * - PII detection (SSN, email, phone, credit card)
 * - Jailbreak prevention (prompt injection patterns)
 * - Receipt logging for blocks only
 * - ConfigEngine integration for enable/disable
 *
 * Usage:
 * ```typescript
 * const safety = new SafetyMiddleware({ configEngine });
 * await safety.checkSafety(input, { sessionId, orgId, engineName: 'SilentEngine' });
 * ```
 */

import { ReceiptWriter } from '@qbos/truthserum'
import * as crypto from 'crypto'

export interface SafetyContext {
  sessionId: string
  orgId?: string
  userId?: string
  engineName: string
  operation?: string
}

export interface SafetyResult {
  allowed: boolean
  violations: SafetyViolation[]
  inputHash?: string
}

export interface SafetyViolation {
  type: 'pii' | 'jailbreak' | 'content_moderation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  matched_pattern?: string
}

export interface SafetyConfig {
  enabled: boolean
  detectPII: boolean
  detectJailbreak: boolean
  detectContentModeration: boolean
  logAllowed: boolean // Default: false (log blocks only)
}

export interface ConfigEngineInterface {
  getConfig(key: string, context?: { orgId?: string; userId?: string }): Promise<any>
}

export class SafetyMiddleware {
  private configEngine?: ConfigEngineInterface

  constructor(options: { configEngine?: ConfigEngineInterface } = {}) {
    this.configEngine = options.configEngine
  }

  /**
   * Main safety check - validates input against all enabled checks
   */
  async checkSafety(
    input: string | object,
    context: SafetyContext
  ): Promise<SafetyResult> {
    // Get safety configuration
    const config = await this.getSafetyConfig(context)

    if (!config.enabled) {
      return { allowed: true, violations: [] }
    }

    // Convert input to string for analysis
    const inputText = typeof input === 'string' ? input : JSON.stringify(input)

    // Hash input for receipt logging (don't log actual sensitive content)
    const inputHash = this.hashInput(inputText)

    // Run all enabled checks
    const violations: SafetyViolation[] = []

    if (config.detectPII) {
      const piiViolations = this.detectPII(inputText)
      violations.push(...piiViolations)
    }

    if (config.detectJailbreak) {
      const jailbreakViolations = this.detectJailbreak(inputText)
      violations.push(...jailbreakViolations)
    }

    if (config.detectContentModeration) {
      const contentViolations = this.detectInappropriateContent(inputText)
      violations.push(...contentViolations)
    }

    const allowed = violations.length === 0

    // Log to receipts (blocks only, unless configured otherwise)
    if (!allowed || config.logAllowed) {
      await this.logSafetyCheck(context, {
        allowed,
        violations,
        inputHash
      })
    }

    return {
      allowed,
      violations,
      inputHash
    }
  }

  /**
   * Detect PII (Personally Identifiable Information)
   */
  private detectPII(input: string): SafetyViolation[] {
    const violations: SafetyViolation[] = []

    // SSN pattern (XXX-XX-XXXX)
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g
    if (ssnPattern.test(input)) {
      violations.push({
        type: 'pii',
        severity: 'critical',
        description: 'Social Security Number detected',
        matched_pattern: 'SSN'
      })
    }

    // Email pattern
    const emailPattern = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi
    if (emailPattern.test(input)) {
      violations.push({
        type: 'pii',
        severity: 'medium',
        description: 'Email address detected',
        matched_pattern: 'Email'
      })
    }

    // Phone number pattern (US format)
    const phonePattern = /\b(\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
    if (phonePattern.test(input)) {
      violations.push({
        type: 'pii',
        severity: 'medium',
        description: 'Phone number detected',
        matched_pattern: 'Phone'
      })
    }

    // Credit card pattern (simple validation)
    const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
    if (ccPattern.test(input)) {
      // Additional Luhn check could be added here
      violations.push({
        type: 'pii',
        severity: 'critical',
        description: 'Credit card number detected',
        matched_pattern: 'CreditCard'
      })
    }

    // IP Address
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
    if (ipPattern.test(input)) {
      violations.push({
        type: 'pii',
        severity: 'low',
        description: 'IP address detected',
        matched_pattern: 'IPAddress'
      })
    }

    return violations
  }

  /**
   * Detect jailbreak/prompt injection attempts
   */
  private detectJailbreak(input: string): SafetyViolation[] {
    const violations: SafetyViolation[] = []
    const inputLower = input.toLowerCase()

    // Common jailbreak patterns
    const jailbreakPatterns = [
      {
        pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
        description: 'Prompt injection: ignore previous instructions'
      },
      {
        pattern: /disregard\s+(all\s+)?(previous|prior|above)/i,
        description: 'Prompt injection: disregard previous'
      },
      {
        pattern: /forget\s+(all\s+)?(previous|prior|above)/i,
        description: 'Prompt injection: forget previous'
      },
      {
        pattern: /(system\s+prompt|new\s+instructions?):/i,
        description: 'Prompt injection: system prompt override'
      },
      {
        pattern: /you\s+are\s+now\s+(a|an)\s+/i,
        description: 'Prompt injection: role change attempt'
      },
      {
        pattern: /\[INST\]|\[\/INST\]/i,
        description: 'Prompt injection: instruction tags'
      },
      {
        pattern: /<<<\s*END/i,
        description: 'Prompt injection: control sequence'
      },
      {
        pattern: /sudo\s+mode/i,
        description: 'Prompt injection: sudo mode'
      },
      {
        pattern: /developer\s+mode/i,
        description: 'Prompt injection: developer mode'
      }
    ]

    for (const { pattern, description } of jailbreakPatterns) {
      if (pattern.test(input)) {
        violations.push({
          type: 'jailbreak',
          severity: 'high',
          description,
          matched_pattern: pattern.source
        })
      }
    }

    return violations
  }

  /**
   * Detect inappropriate content (basic patterns)
   */
  private detectInappropriateContent(input: string): SafetyViolation[] {
    const violations: SafetyViolation[] = []
    const inputLower = input.toLowerCase()

    // Violent content indicators
    const violencePatterns = [
      /\b(kill|murder|bomb|weapon|explosive)\s+(someone|people|users)/i,
      /how\s+to\s+(make|build)\s+(a\s+)?(bomb|weapon|explosive)/i
    ]

    for (const pattern of violencePatterns) {
      if (pattern.test(input)) {
        violations.push({
          type: 'content_moderation',
          severity: 'critical',
          description: 'Violent content detected',
          matched_pattern: pattern.source
        })
      }
    }

    // Hate speech indicators (basic)
    const hatePatterns = [
      /\b(hate|kill)\s+all\s+\w+s\b/i
    ]

    for (const pattern of hatePatterns) {
      if (pattern.test(input)) {
        violations.push({
          type: 'content_moderation',
          severity: 'critical',
          description: 'Hate speech detected',
          matched_pattern: pattern.source
        })
      }
    }

    return violations
  }

  /**
   * Get safety configuration from ConfigEngine or use defaults
   */
  private async getSafetyConfig(context: SafetyContext): Promise<SafetyConfig> {
    if (!this.configEngine) {
      // Default config when no ConfigEngine available
      return {
        enabled: true,
        detectPII: true,
        detectJailbreak: true,
        detectContentModeration: true,
        logAllowed: false
      }
    }

    try {
      const config = await this.configEngine.getConfig('safety.policy', {
        orgId: context.orgId,
        userId: context.userId
      })

      return {
        enabled: config?.enabled ?? true,
        detectPII: config?.detectPII ?? true,
        detectJailbreak: config?.detectJailbreak ?? true,
        detectContentModeration: config?.detectContentModeration ?? true,
        logAllowed: config?.logAllowed ?? false
      }
    } catch (error) {
      // Fallback to defaults on error
      console.warn('Failed to load safety config, using defaults:', error)
      return {
        enabled: true,
        detectPII: true,
        detectJailbreak: true,
        detectContentModeration: true,
        logAllowed: false
      }
    }
  }

  /**
   * Hash input for receipt logging (SHA-256)
   */
  private hashInput(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  /**
   * Log safety check to TruthSerum receipts
   */
  private async logSafetyCheck(
    context: SafetyContext,
    result: SafetyResult
  ): Promise<void> {
    await ReceiptWriter.write({
      sessionId: context.sessionId,
      type: result.allowed ? 'safety.allowed' : 'safety.blocked',
      details: {
        engine: context.engineName,
        operation: context.operation,
        input_hash: result.inputHash,
        violations_count: result.violations.length,
        violations: result.violations.map(v => ({
          type: v.type,
          severity: v.severity,
          description: v.description
        })),
        org_id: context.orgId,
        user_id: context.userId,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Validate safety check was performed (for auditing)
   */
  async verifySafetyCheck(sessionId: string, inputHash: string): Promise<boolean> {
    // In production, this would query TruthSerum database for matching receipt
    // For now, we just return true (assumes receipt was written)
    return true
  }
}

/**
 * Error thrown when safety check fails
 */
export class SafetyError extends Error {
  public violations: SafetyViolation[]

  constructor(message: string, violations: SafetyViolation[]) {
    super(message)
    this.name = 'SafetyError'
    this.violations = violations
  }
}

/**
 * Helper to throw SafetyError if check fails
 */
export async function enforceSafety(
  middleware: SafetyMiddleware,
  input: string | object,
  context: SafetyContext
): Promise<void> {
  const result = await middleware.checkSafety(input, context)

  if (!result.allowed) {
    throw new SafetyError(
      `Safety check failed: ${result.violations.map(v => v.description).join(', ')}`,
      result.violations
    )
  }
}
