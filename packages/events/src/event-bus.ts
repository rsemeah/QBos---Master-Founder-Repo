/**
 * EventBus - Core Event Coordination Interface
 *
 * All QuietBuild OS engines communicate through the EventBus.
 * This abstraction allows swapping between in-memory (dev) and database-driven (prod).
 */

export interface Event<T = any> {
  /** Unique event identifier */
  id: string;

  /** Event name (e.g., "user.created", "sight.image.validated") */
  name: string;

  /** Event payload data */
  payload: T;

  /** Additional metadata (timestamps, trace IDs, etc.) */
  metadata: EventMetadata;

  /** Idempotency key to prevent duplicate processing */
  idempotencyKey: string;
}

export interface EventMetadata {
  /** Engine that emitted this event */
  sourceEngine?: string;

  /** Correlation ID for tracing related events */
  correlationId?: string;

  /** User ID associated with this event */
  userId?: string;

  /** Timestamp when event was created */
  timestamp: string;

  /** Additional custom metadata */
  [key: string]: any;
}

export interface EventHandler<T = any> {
  /** Handler function that processes the event */
  (event: Event<T>): Promise<void>;
}

export interface EventBusOptions {
  /** Worker ID for distributed processing */
  workerId?: string;

  /** Batch size for event processing */
  batchSize?: number;

  /** Max retry attempts for failed events */
  maxRetries?: number;
}

/**
 * EventBus Interface
 *
 * Provides pub/sub event coordination for QuietBuild OS engines.
 */
export interface EventBus {
  /**
   * Emit an event to the bus
   *
   * @param name - Event name
   * @param payload - Event data
   * @param options - Additional options (metadata, idempotency key)
   * @returns Event ID
   */
  emit<T = any>(
    name: string,
    payload: T,
    options?: EmitOptions
  ): Promise<string>;

  /**
   * Subscribe to events by name pattern
   *
   * @param pattern - Event name or pattern (e.g., "user.*", "sight.image.validated")
   * @param handler - Function to handle matching events
   * @returns Unsubscribe function
   */
  on<T = any>(
    pattern: string,
    handler: EventHandler<T>
  ): () => void;

  /**
   * Start processing events
   *
   * For database-driven adapters, this starts the worker loop.
   * For in-memory adapters, this is a no-op.
   */
  start(): Promise<void>;

  /**
   * Stop processing events gracefully
   *
   * Waits for in-flight events to complete.
   */
  stop(): Promise<void>;

  /**
   * Get event by ID (for debugging/monitoring)
   */
  getEvent(eventId: string): Promise<Event | null>;
}

export interface EmitOptions {
  /** Custom metadata to attach to event */
  metadata?: Partial<EventMetadata>;

  /** Custom idempotency key (auto-generated if not provided) */
  idempotencyKey?: string;
}

/**
 * Event pattern matching utility
 *
 * Supports wildcards:
 * - "user.*" matches "user.created", "user.updated", etc.
 * - "*.created" matches "user.created", "post.created", etc.
 * - "*" matches all events
 */
export function matchesPattern(eventName: string, pattern: string): boolean {
  if (pattern === '*') return true;

  const patternParts = pattern.split('.');
  const eventParts = eventName.split('.');

  if (patternParts.length !== eventParts.length) return false;

  return patternParts.every((part, i) => {
    return part === '*' || part === eventParts[i];
  });
}

/**
 * Generate idempotency key helper
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
