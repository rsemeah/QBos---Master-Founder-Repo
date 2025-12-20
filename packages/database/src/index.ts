/**
 * @qbos/database - QuietBuild OS Database Package
 *
 * Exports database types, schemas, and helpers for QuietBuild OS.
 * All engines use these types to interact with the database.
 */

// ============================================================================
// EVENT OUTBOX TYPES
// ============================================================================

export type EventStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'failed_permanent';

export interface QBosEvent {
  id: string;
  name: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
  idempotency_key: string;
  status: EventStatus;
  attempt_count: number;
  next_attempt_at: string | null;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
  processed_at: string | null;
  error: string | null;
}

export interface InsertEventParams {
  name: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  idempotency_key: string;
}

export interface FetchEventsResult {
  id: string;
  name: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
  attempt_count: number;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InsertProfileParams {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProfileParams {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface InsertAuditLogParams {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// ============================================================================
// DATABASE TABLES (for reference)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      qbos_events: {
        Row: QBosEvent;
        Insert: InsertEventParams;
        Update: Partial<QBosEvent>;
      };
      profiles: {
        Row: Profile;
        Insert: InsertProfileParams;
        Update: UpdateProfileParams;
      };
      audit_log: {
        Row: AuditLog;
        Insert: InsertAuditLogParams;
        Update: never;
      };
    };
    Functions: {
      insert_qbos_event: {
        Args: {
          p_name: string;
          p_payload: Record<string, any>;
          p_metadata: Record<string, any>;
          p_idempotency_key: string;
        };
        Returns: string; // UUID
      };
      fetch_and_lock_events: {
        Args: {
          p_worker_id: string;
          p_batch_size?: number;
        };
        Returns: FetchEventsResult[];
      };
      mark_event_processed: {
        Args: {
          p_event_id: string;
        };
        Returns: void;
      };
      mark_event_failed: {
        Args: {
          p_event_id: string;
          p_attempt_count: number;
          p_error: string;
          p_max_retries?: number;
        };
        Returns: void;
      };
    };
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate idempotency key for events
 *
 * Format: {engine}:{action}:{resource_id}:{timestamp}:{random}
 */
export function generateIdempotencyKey(
  engine: string,
  action: string,
  resourceId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const resource = resourceId || 'global';
  return `${engine}:${action}:${resource}:${timestamp}:${random}`;
}

/**
 * Check if event is in terminal state (won't be processed again)
 */
export function isEventTerminal(status: EventStatus): boolean {
  return status === 'processed' || status === 'failed_permanent';
}

/**
 * Check if event is retriable
 */
export function isEventRetriable(status: EventStatus): boolean {
  return status === 'failed';
}

/**
 * Calculate next retry time for exponential backoff
 */
export function calculateNextRetry(attemptCount: number): Date {
  const minutes = Math.pow(2, attemptCount);
  return new Date(Date.now() + minutes * 60 * 1000);
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_EVENT_RETRIES = 5;
export const EVENT_LOCK_TIMEOUT_MINUTES = 5;
export const DEFAULT_EVENT_BATCH_SIZE = 100;

/**
 * Common event names for QuietBuild OS
 * Engines should extend this with their own event names
 */
export const CORE_EVENTS = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

  // Profile events
  PROFILE_CREATED: 'profile.created',
  PROFILE_UPDATED: 'profile.updated',

  // System events
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_ERROR: 'system.error',
} as const;

export type CoreEventName = typeof CORE_EVENTS[keyof typeof CORE_EVENTS];
