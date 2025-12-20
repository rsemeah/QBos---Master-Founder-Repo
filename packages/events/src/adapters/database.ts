/**
 * DatabaseEventBus - Production event bus using database outbox pattern
 *
 * Features:
 * - Persistent event storage in qbos_events table
 * - Worker-based event processing with locking
 * - Automatic retries with exponential backoff
 * - Guaranteed delivery (at-least-once semantics)
 * - Idempotent event insertion
 *
 * How it works:
 * 1. emit() inserts events into qbos_events table
 * 2. Worker loop polls for pending events
 * 3. Events are locked and dispatched to handlers
 * 4. Successful handlers mark events as processed
 * 5. Failed handlers trigger retry with backoff
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  EventBus,
  Event,
  EventHandler,
  EventBusOptions,
  EmitOptions,
  matchesPattern,
  generateEventId,
} from '../event-bus';
import {
  generateIdempotencyKey,
  FetchEventsResult,
  MAX_EVENT_RETRIES,
  DEFAULT_EVENT_BATCH_SIZE,
  Database,
} from '@qbos/database';

interface Subscription {
  pattern: string;
  handler: EventHandler;
}

export interface DatabaseEventBusOptions extends EventBusOptions {
  /** Supabase client (must use service role key) */
  supabase: SupabaseClient<Database>;

  /** Worker poll interval in milliseconds */
  pollInterval?: number;
}

export class DatabaseEventBus implements EventBus {
  private supabase: SupabaseClient<Database>;
  private subscriptions: Subscription[] = [];
  private isRunning = false;
  private workerPromise: Promise<void> | null = null;
  private workerId: string;
  private pollInterval: number;
  private batchSize: number;
  private maxRetries: number;

  constructor(options: DatabaseEventBusOptions) {
    this.supabase = options.supabase;
    this.workerId = options.workerId || `worker_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.pollInterval = options.pollInterval || 1000; // 1 second default
    this.batchSize = options.batchSize || DEFAULT_EVENT_BATCH_SIZE;
    this.maxRetries = options.maxRetries || MAX_EVENT_RETRIES;
  }

  async emit<T = any>(
    name: string,
    payload: T,
    options?: EmitOptions
  ): Promise<string> {
    const idempotencyKey =
      options?.idempotencyKey ||
      generateIdempotencyKey('event-bus', name, undefined);

    const metadata = {
      timestamp: new Date().toISOString(),
      ...options?.metadata,
    };

    // Call database function to insert event (idempotent)
    const { data, error } = await this.supabase.rpc('insert_qbos_event', {
      p_name: name,
      p_payload: payload as any,
      p_metadata: metadata as any,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      throw new Error(`Failed to emit event: ${error.message}`);
    }

    return data as string; // Returns event UUID
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
    if (this.isRunning) {
      console.warn('⚠️  DatabaseEventBus already running');
      return;
    }

    this.isRunning = true;
    console.log(`✅ DatabaseEventBus started (worker: ${this.workerId})`);

    // Start worker loop
    this.workerPromise = this.workerLoop();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`🛑 Stopping DatabaseEventBus (worker: ${this.workerId})...`);
    this.isRunning = false;

    // Wait for worker loop to finish current batch
    if (this.workerPromise) {
      await this.workerPromise;
    }

    console.log('✅ DatabaseEventBus stopped gracefully');
  }

  async getEvent(eventId: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('qbos_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      payload: data.payload as any,
      metadata: data.metadata as any,
      idempotencyKey: data.idempotency_key,
    };
  }

  /**
   * Worker loop: Poll for events and process them
   */
  private async workerLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processBatch();
      } catch (error) {
        console.error('❌ Worker loop error:', error);
      }

      // Wait before next poll
      await this.sleep(this.pollInterval);
    }
  }

  /**
   * Process a batch of events
   */
  private async processBatch(): Promise<void> {
    // Fetch and lock events
    const { data: events, error } = await this.supabase.rpc(
      'fetch_and_lock_events',
      {
        p_worker_id: this.workerId,
        p_batch_size: this.batchSize,
      }
    );

    if (error) {
      console.error('❌ Failed to fetch events:', error);
      return;
    }

    if (!events || events.length === 0) {
      return; // No events to process
    }

    console.log(`📦 Processing ${events.length} event(s)...`);

    // Process events concurrently
    await Promise.all(
      events.map((dbEvent) => this.processEvent(dbEvent))
    );
  }

  /**
   * Process a single event
   */
  private async processEvent(dbEvent: FetchEventsResult): Promise<void> {
    const event: Event = {
      id: dbEvent.id,
      name: dbEvent.name,
      payload: dbEvent.payload,
      metadata: dbEvent.metadata,
      idempotencyKey: `${dbEvent.id}`, // Use event ID as idempotency key for handlers
    };

    // Find matching handlers
    const matchingSubscriptions = this.subscriptions.filter((sub) =>
      matchesPattern(event.name, sub.pattern)
    );

    if (matchingSubscriptions.length === 0) {
      // No handlers registered - mark as processed anyway
      await this.markProcessed(event.id);
      return;
    }

    try {
      // Execute all handlers concurrently
      await Promise.all(
        matchingSubscriptions.map((sub) => sub.handler(event))
      );

      // All handlers succeeded - mark as processed
      await this.markProcessed(event.id);
    } catch (error: any) {
      // Handler failed - mark as failed for retry
      await this.markFailed(
        event.id,
        dbEvent.attempt_count,
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Mark event as successfully processed
   */
  private async markProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabase.rpc('mark_event_processed', {
      p_event_id: eventId,
    });

    if (error) {
      console.error(`❌ Failed to mark event ${eventId} as processed:`, error);
    }
  }

  /**
   * Mark event as failed (with retry)
   */
  private async markFailed(
    eventId: string,
    attemptCount: number,
    errorMessage: string
  ): Promise<void> {
    const { error } = await this.supabase.rpc('mark_event_failed', {
      p_event_id: eventId,
      p_attempt_count: attemptCount,
      p_error: errorMessage,
      p_max_retries: this.maxRetries,
    });

    if (error) {
      console.error(`❌ Failed to mark event ${eventId} as failed:`, error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
