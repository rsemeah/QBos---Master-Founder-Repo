/**
 * SafetyEngine™ Types
 *
 * Content moderation, user safety, and compliance types.
 */

// ============================================================================
// MODERATION TYPES
// ============================================================================

export type ContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'url'
  | 'user_profile';

export type ModerationDecision =
  | 'approved'      // Content is safe
  | 'flagged'       // Content needs review
  | 'rejected'      // Content violates policies
  | 'auto_approved' // Auto-approved based on user reputation
  | 'pending';      // Awaiting moderation

export type ViolationType =
  | 'hate_speech'
  | 'violence'
  | 'sexual_content'
  | 'harassment'
  | 'spam'
  | 'misinformation'
  | 'self_harm'
  | 'illegal_content'
  | 'copyright'
  | 'privacy'
  | 'other';

export interface ModerationRequest {
  /** Unique request ID */
  id: string;

  /** Content type being moderated */
  contentType: ContentType;

  /** Content to moderate (text, URL, or base64 image) */
  content: string;

  /** User who created the content */
  userId?: string;

  /** Resource ID (post ID, comment ID, etc.) */
  resourceId?: string;

  /** Resource type (post, comment, profile, etc.) */
  resourceType?: string;

  /** Additional context for moderation */
  metadata?: Record<string, any>;
}

export interface ModerationResult {
  /** Request ID */
  requestId: string;

  /** Moderation decision */
  decision: ModerationDecision;

  /** Confidence score (0-1) */
  confidence: number;

  /** Detected violations (if any) */
  violations: Violation[];

  /** Explanation of decision */
  explanation?: string;

  /** Moderator used (openai, perspective, manual, etc.) */
  moderator: string;

  /** Processing time (ms) */
  processingTime: number;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface Violation {
  /** Type of violation */
  type: ViolationType;

  /** Severity (0-1, where 1 is most severe) */
  severity: number;

  /** Explanation of violation */
  explanation?: string;

  /** Location in content (for text) */
  location?: {
    start: number;
    end: number;
  };
}

// ============================================================================
// MODERATOR INTERFACE
// ============================================================================

export interface Moderator {
  /** Moderator name (e.g., "openai", "perspective") */
  name: string;

  /** Content types this moderator supports */
  supportedTypes: ContentType[];

  /**
   * Moderate content
   *
   * @param request - Moderation request
   * @returns Moderation result
   */
  moderate(request: ModerationRequest): Promise<ModerationResult>;

  /**
   * Health check
   *
   * @returns true if moderator is operational
   */
  healthCheck(): Promise<boolean>;
}

// ============================================================================
// POLICY TYPES
// ============================================================================

export interface SafetyPolicy {
  /** Policy ID */
  id: string;

  /** Policy name */
  name: string;

  /** Violation types covered by this policy */
  violationTypes: ViolationType[];

  /** Minimum confidence threshold for auto-approval */
  autoApprovalThreshold: number;

  /** Minimum confidence threshold for auto-rejection */
  autoRejectionThreshold: number;

  /** Maximum severity for auto-approval */
  maxAutoApprovalSeverity: number;

  /** Actions to take on violation */
  actions: PolicyAction[];
}

export interface PolicyAction {
  /** Action type */
  type: 'notify_user' | 'notify_admin' | 'quarantine' | 'delete' | 'ban_user';

  /** Action parameters */
  params?: Record<string, any>;
}

// ============================================================================
// USER REPUTATION TYPES
// ============================================================================

export interface UserReputation {
  /** User ID */
  userId: string;

  /** Reputation score (0-100) */
  score: number;

  /** Total content submissions */
  totalSubmissions: number;

  /** Approved submissions */
  approvedSubmissions: number;

  /** Rejected submissions */
  rejectedSubmissions: number;

  /** Flagged submissions */
  flaggedSubmissions: number;

  /** Last violation date */
  lastViolation?: string;

  /** Is user trusted? (can skip some checks) */
  isTrusted: boolean;

  /** Is user banned? */
  isBanned: boolean;
}

// ============================================================================
// SAFETY EVENTS
// ============================================================================

export const SAFETY_EVENTS = {
  /** Content submitted for moderation */
  CONTENT_SUBMITTED: 'safety.content.submitted',

  /** Content approved */
  CONTENT_APPROVED: 'safety.content.approved',

  /** Content flagged for review */
  CONTENT_FLAGGED: 'safety.content.flagged',

  /** Content rejected */
  CONTENT_REJECTED: 'safety.content.rejected',

  /** User reputation updated */
  REPUTATION_UPDATED: 'safety.reputation.updated',

  /** User banned */
  USER_BANNED: 'safety.user.banned',
} as const;

export type SafetyEventName = typeof SAFETY_EVENTS[keyof typeof SAFETY_EVENTS];
