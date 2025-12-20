/**
 * InMemoryEventBus - Simple in-memory event bus for development/testing
 *
 * WARNING: Events are NOT persisted. Use DatabaseEventBus for production.
 *
 * Features:
 * - Immediate event processing (no worker loop)
 * - Multiple subscribers per event pattern
 * - Pattern matching with wildcards
 * - Event history for debugging
 */

import {
  EventBus,
  Event,
  EventHandler,
  EventBusOptions,
  EmitOptions,
  matchesPattern,
  generateEventId,
} from '../event-bus';
import { generateIdempotencyKey } from '@qbos/database';

interface Subscription {
  pattern: string;
  handler: EventHandler;
}

export class InMemoryEventBus implements EventBus {
  private subscriptions: Subscription[] = [];
  private eventHistory: Map<string, Event> = new Map();
  private seenIdempotencyKeys: Set<string> = new Set();
  private isRunning = false;

  constructor(private options: EventBusOptions = {}) {}

  async emit<T = any>(
    name: string,
    payload: T,
    options?: EmitOptions
  ): Promise<string> {
    const idempotencyKey =
      options?.idempotencyKey ||
      generateIdempotencyKey('event-bus', name, undefined);

    // Check idempotency
    if (this.seenIdempotencyKeys.has(idempotencyKey)) {
      // Find existing event with this key
      const existingEvent = Array.from(this.eventHistory.values()).find(
        (e) => e.idempotencyKey === idempotencyKey
      );
      return existingEvent?.id || 'duplicate';
    }

    const event: Event<T> = {
      id: generateEventId(),
      name,
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        ...options?.metadata,
      },
      idempotencyKey,
    };

    // Store event in history
    this.eventHistory.set(event.id, event);
    this.seenIdempotencyKeys.add(idempotencyKey);

    // Process event immediately (in-memory = synchronous)
    await this.processEvent(event);

    return event.id;
  }

  on<T = any>(pattern: string, handler: EventHandler<T>): () => void {
    const subscription: Subscription = { pattern, handler };
    this.subscriptions.push(subscription);

    // Return unsubscribe function
    return () => {
      const index = this.subscriptions.indexOf(subscription);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('✅ InMemoryEventBus started (synchronous mode)');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 InMemoryEventBus stopped');
  }

  async getEvent(eventId: string): Promise<Event | null> {
    return this.eventHistory.get(eventId) || null;
  }

  /**
   * Get all events (for debugging)
   */
  getAllEvents(): Event[] {
    return Array.from(this.eventHistory.values());
  }

  /**
   * Clear event history (for testing)
   */
  clear(): void {
    this.eventHistory.clear();
    this.seenIdempotencyKeys.clear();
  }

  /**
   * Process event by notifying all matching subscribers
   */
  private async processEvent(event: Event): Promise<void> {
    const matchingSubscriptions = this.subscriptions.filter((sub) =>
      matchesPattern(event.name, sub.pattern)
    );

    // Execute all handlers concurrently
    const handlerPromises = matchingSubscriptions.map(async (sub) => {
      try {
        await sub.handler(event);
      } catch (error) {
        console.error(
          `❌ Handler failed for event ${event.name}:`,
          error
        );
        // In-memory mode: log error but don't retry
      }
    });

    await Promise.all(handlerPromises);
  }
}
