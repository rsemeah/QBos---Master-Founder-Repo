/**
 * Engine - Core interface for all QuietBuild OS engines
 *
 * Every engine (Silent, Sight, Safety, etc.) implements this interface.
 * The runtime uses this to manage lifecycle and coordination.
 */

import { EventBus } from '@qbos/events';

export interface EngineMetadata {
  /** Unique engine identifier (e.g., "silent-engine", "sight-engine") */
  id: string;

  /** Human-readable name */
  name: string;

  /** Engine version */
  version: string;

  /** Engine description */
  description: string;

  /** Engine capabilities/tags */
  capabilities?: string[];

  /** Dependencies on other engines */
  dependencies?: string[];
}

export interface EngineConfig {
  /** Is this engine enabled? */
  enabled: boolean;

  /** Engine-specific configuration */
  config?: Record<string, any>;

  /** Policy overrides */
  policies?: Record<string, any>;
}

export interface EngineContext {
  /** Event bus for coordination */
  eventBus: EventBus;

  /** Engine configuration */
  config: EngineConfig;

  /** User ID (if engine is running in user context) */
  userId?: string;

  /** Request context (correlation ID, trace ID, etc.) */
  requestContext?: Record<string, any>;
}

/**
 * Engine Interface
 *
 * All QuietBuild OS engines implement this lifecycle.
 */
export interface Engine {
  /** Engine metadata */
  readonly metadata: EngineMetadata;

  /**
   * Initialize the engine
   *
   * Called once during bootstrap.
   * Register event handlers, setup resources, etc.
   */
  initialize(context: EngineContext): Promise<void>;

  /**
   * Start the engine
   *
   * Called after all engines are initialized.
   * Begin processing events.
   */
  start(): Promise<void>;

  /**
   * Stop the engine gracefully
   *
   * Called during shutdown.
   * Finish in-flight operations, cleanup resources.
   */
  stop(): Promise<void>;

  /**
   * Health check
   *
   * Returns true if engine is healthy, false otherwise.
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Abstract base class for engines
 *
 * Provides common functionality for all engines.
 */
export abstract class BaseEngine implements Engine {
  abstract readonly metadata: EngineMetadata;

  protected context!: EngineContext;
  protected isInitialized = false;
  protected isRunning = false;

  async initialize(context: EngineContext): Promise<void> {
    if (this.isInitialized) {
      throw new Error(`Engine ${this.metadata.id} already initialized`);
    }

    this.context = context;
    await this.onInitialize();
    this.isInitialized = true;

    console.log(`✅ ${this.metadata.name} initialized`);
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(`Engine ${this.metadata.id} not initialized`);
    }

    if (this.isRunning) {
      throw new Error(`Engine ${this.metadata.id} already running`);
    }

    await this.onStart();
    this.isRunning = true;

    console.log(`🚀 ${this.metadata.name} started`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.onStop();
    this.isRunning = false;

    console.log(`🛑 ${this.metadata.name} stopped`);
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isRunning) {
      return false;
    }

    return this.onHealthCheck();
  }

  /**
   * Subclasses override these methods
   */
  protected abstract onInitialize(): Promise<void>;
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
  protected abstract onHealthCheck(): Promise<boolean>;

  /**
   * Helper: Emit event through event bus
   */
  protected async emit<T = any>(
    name: string,
    payload: T,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.context.eventBus.emit(name, payload, {
      metadata: {
        sourceEngine: this.metadata.id,
        ...metadata,
      },
    });
  }

  /**
   * Helper: Subscribe to events
   */
  protected on<T = any>(
    pattern: string,
    handler: (event: import('@qbos/events').Event<T>) => Promise<void>
  ): () => void {
    return this.context.eventBus.on(pattern, handler);
  }
}
