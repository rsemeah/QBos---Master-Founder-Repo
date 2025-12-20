/**
 * PatternModerator - Simple pattern-based content moderation
 *
 * Uses keyword matching and regex patterns to detect violations.
 * This is a basic moderator for demonstration - use AI moderators in production.
 */

import {
  Moderator,
  ModerationRequest,
  ModerationResult,
  ModerationDecision,
  Violation,
  ViolationType,
  ContentType,
} from '../types';

interface Pattern {
  regex: RegExp;
  violationType: ViolationType;
  severity: number;
  explanation: string;
}

export class PatternModerator implements Moderator {
  name = 'pattern-moderator';
  supportedTypes: ContentType[] = ['text', 'user_profile'];

  private patterns: Pattern[] = [
    // Hate speech patterns
    {
      regex: /\b(hate|racist|bigot|nazi)\b/i,
      violationType: 'hate_speech',
      severity: 0.8,
      explanation: 'Contains hate speech keywords',
    },

    // Violence patterns
    {
      regex: /\b(kill|murder|assault|attack|weapon)\b/i,
      violationType: 'violence',
      severity: 0.7,
      explanation: 'Contains violent language',
    },

    // Sexual content patterns
    {
      regex: /\b(porn|xxx|sex|nude)\b/i,
      violationType: 'sexual_content',
      severity: 0.6,
      explanation: 'Contains sexual content keywords',
    },

    // Spam patterns
    {
      regex: /\b(buy now|click here|limited time|act now)\b/i,
      violationType: 'spam',
      severity: 0.5,
      explanation: 'Appears to be spam',
    },

    // Personal information patterns
    {
      regex: /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      violationType: 'privacy',
      severity: 0.9,
      explanation: 'Contains what appears to be a Social Security Number',
    },
  ];

  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    const startTime = Date.now();

    if (!this.supportedTypes.includes(request.contentType)) {
      throw new Error(
        `PatternModerator does not support content type: ${request.contentType}`
      );
    }

    const violations: Violation[] = [];

    // Check content against all patterns
    for (const pattern of this.patterns) {
      const matches = request.content.matchAll(new RegExp(pattern.regex, 'gi'));

      for (const match of matches) {
        violations.push({
          type: pattern.violationType,
          severity: pattern.severity,
          explanation: pattern.explanation,
          location: match.index !== undefined
            ? {
                start: match.index,
                end: match.index + match[0].length,
              }
            : undefined,
        });
      }
    }

    // Calculate decision based on violations
    let decision: ModerationDecision;
    let confidence: number;

    if (violations.length === 0) {
      decision = 'approved';
      confidence = 0.95;
    } else {
      const maxSeverity = Math.max(...violations.map((v) => v.severity));

      if (maxSeverity >= 0.8) {
        decision = 'rejected';
        confidence = 0.9;
      } else if (maxSeverity >= 0.6) {
        decision = 'flagged';
        confidence = 0.7;
      } else {
        decision = 'flagged';
        confidence = 0.6;
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      requestId: request.id,
      decision,
      confidence,
      violations,
      explanation:
        violations.length === 0
          ? 'No policy violations detected'
          : `Detected ${violations.length} potential violation(s)`,
      moderator: this.name,
      processingTime,
    };
  }

  async healthCheck(): Promise<boolean> {
    // Pattern moderator is always healthy (no external dependencies)
    return true;
  }

  /**
   * Add custom pattern
   */
  addPattern(pattern: Pattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Remove pattern by index
   */
  removePattern(index: number): void {
    this.patterns.splice(index, 1);
  }

  /**
   * Get all patterns
   */
  getPatterns(): Pattern[] {
    return [...this.patterns];
  }
}
