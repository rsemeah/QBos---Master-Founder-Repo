/**
 * SafetyEngine™ - Content Moderation and User Safety
 *
 * Responsibilities:
 * - Content moderation (text, images, videos)
 * - User reputation management
 * - Policy enforcement
 * - Safety event emission
 *
 * Integration:
 * - Listens for content.created events
 * - Emits safety.* events
 * - Coordinates with multiple moderators
 */

import { BaseEngine, EngineMetadata } from '@qbos/runtime';
import { Event } from '@qbos/events';
import { generateIdempotencyKey } from '@qbos/database';
import {
  Moderator,
  ModerationRequest,
  ModerationResult,
  ModerationDecision,
  SafetyPolicy,
  UserReputation,
  SAFETY_EVENTS,
} from './types';

export interface SafetyEngineConfig {
  /** Registered moderators */
  moderators: Moderator[];

  /** Safety policies */
  policies: SafetyPolicy[];

  /** Default policy (if none match) */
  defaultPolicy: SafetyPolicy;

  /** Enable user reputation tracking */
  enableReputationTracking?: boolean;
}

export class SafetyEngine extends BaseEngine {
  readonly metadata: EngineMetadata = {
    id: 'safety-engine',
    name: 'SafetyEngine™',
    version: '1.0.0',
    description: 'Content moderation and user safety',
    capabilities: ['content_moderation', 'user_reputation', 'policy_enforcement'],
  };

  private moderators: Map<string, Moderator> = new Map();
  private policies: SafetyPolicy[] = [];
  private defaultPolicy!: SafetyPolicy;
  private enableReputationTracking = true;

  protected async onInitialize(): Promise<void> {
    const config = this.context.config.config as SafetyEngineConfig;

    // Register moderators
    for (const moderator of config.moderators) {
      this.moderators.set(moderator.name, moderator);
      console.log(`   🛡️  Registered moderator: ${moderator.name}`);
    }

    // Load policies
    this.policies = config.policies;
    this.defaultPolicy = config.defaultPolicy;
    this.enableReputationTracking = config.enableReputationTracking ?? true;

    // Subscribe to content events
    this.on('*.content.created', this.handleContentCreated.bind(this));
    this.on('*.content.updated', this.handleContentUpdated.bind(this));

    console.log(`   📋 Loaded ${this.policies.length} safety policies`);
  }

  protected async onStart(): Promise<void> {
    // Verify moderators are healthy
    for (const [name, moderator] of this.moderators) {
      const isHealthy = await moderator.healthCheck();
      if (!isHealthy) {
        console.warn(`   ⚠️  Moderator ${name} failed health check`);
      }
    }
  }

  protected async onStop(): Promise<void> {
    // Nothing to cleanup
  }

  protected async onHealthCheck(): Promise<boolean> {
    // Check if at least one moderator is healthy
    for (const moderator of this.moderators.values()) {
      const isHealthy = await moderator.healthCheck();
      if (isHealthy) return true;
    }
    return false;
  }

  /**
   * Handle content.created events
   */
  private async handleContentCreated(event: Event): Promise<void> {
    const { content, contentType, userId, resourceId, resourceType } = event.payload;

    const request: ModerationRequest = {
      id: generateIdempotencyKey('safety-engine', 'moderate', resourceId),
      contentType: contentType || 'text',
      content,
      userId,
      resourceId,
      resourceType,
      metadata: event.metadata,
    };

    await this.moderateContent(request);
  }

  /**
   * Handle content.updated events
   */
  private async handleContentUpdated(event: Event): Promise<void> {
    // Re-moderate updated content
    await this.handleContentCreated(event);
  }

  /**
   * Moderate content using registered moderators
   */
  async moderateContent(request: ModerationRequest): Promise<ModerationResult> {
    // Find moderator for this content type
    const moderator = this.findModerator(request.contentType);

    if (!moderator) {
      throw new Error(
        `No moderator available for content type: ${request.contentType}`
      );
    }

    // Moderate content
    const result = await moderator.moderate(request);

    // Apply policy
    await this.applyPolicy(request, result);

    // Emit safety event
    await this.emitSafetyEvent(request, result);

    // Update user reputation (if enabled)
    if (this.enableReputationTracking && request.userId) {
      await this.updateReputation(request.userId, result.decision);
    }

    return result;
  }

  /**
   * Find moderator for content type
   */
  private findModerator(contentType: string): Moderator | undefined {
    for (const moderator of this.moderators.values()) {
      if (moderator.supportedTypes.includes(contentType as any)) {
        return moderator;
      }
    }
    return undefined;
  }

  /**
   * Apply safety policy to moderation result
   */
  private async applyPolicy(
    request: ModerationRequest,
    result: ModerationResult
  ): Promise<void> {
    // Find matching policy
    const policy =
      this.policies.find((p) =>
        result.violations.some((v) => p.violationTypes.includes(v.type))
      ) || this.defaultPolicy;

    // Apply policy actions based on decision
    if (result.decision === 'rejected') {
      for (const action of policy.actions) {
        await this.executeAction(request, result, action);
      }
    }
  }

  /**
   * Execute policy action
   */
  private async executeAction(
    request: ModerationRequest,
    result: ModerationResult,
    action: any
  ): Promise<void> {
    switch (action.type) {
      case 'notify_user':
        await this.emit('safety.notification.user', {
          userId: request.userId,
          message: `Your content was ${result.decision}`,
          reason: result.explanation,
        });
        break;

      case 'notify_admin':
        await this.emit('safety.notification.admin', {
          requestId: request.id,
          userId: request.userId,
          violations: result.violations,
        });
        break;

      case 'quarantine':
        await this.emit('safety.action.quarantine', {
          resourceId: request.resourceId,
          resourceType: request.resourceType,
        });
        break;

      case 'delete':
        await this.emit('safety.action.delete', {
          resourceId: request.resourceId,
          resourceType: request.resourceType,
        });
        break;

      case 'ban_user':
        if (request.userId) {
          await this.emit(SAFETY_EVENTS.USER_BANNED, {
            userId: request.userId,
            reason: result.explanation,
          });
        }
        break;
    }
  }

  /**
   * Emit safety event based on decision
   */
  private async emitSafetyEvent(
    request: ModerationRequest,
    result: ModerationResult
  ): Promise<void> {
    let eventName: string;

    switch (result.decision) {
      case 'approved':
      case 'auto_approved':
        eventName = SAFETY_EVENTS.CONTENT_APPROVED;
        break;
      case 'flagged':
        eventName = SAFETY_EVENTS.CONTENT_FLAGGED;
        break;
      case 'rejected':
        eventName = SAFETY_EVENTS.CONTENT_REJECTED;
        break;
      default:
        return;
    }

    await this.emit(eventName, {
      requestId: request.id,
      userId: request.userId,
      resourceId: request.resourceId,
      resourceType: request.resourceType,
      decision: result.decision,
      violations: result.violations,
      confidence: result.confidence,
      moderator: result.moderator,
    });
  }

  /**
   * Update user reputation based on moderation decision
   */
  private async updateReputation(
    userId: string,
    decision: ModerationDecision
  ): Promise<void> {
    // Emit reputation update event
    // Actual reputation calculation would be done by a reputation service
    await this.emit(SAFETY_EVENTS.REPUTATION_UPDATED, {
      userId,
      decision,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Public API: Get moderator by name
   */
  getModerator(name: string): Moderator | undefined {
    return this.moderators.get(name);
  }

  /**
   * Public API: Get all policies
   */
  getPolicies(): SafetyPolicy[] {
    return [...this.policies];
  }
}
