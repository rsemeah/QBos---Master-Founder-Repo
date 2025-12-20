/**
 * EngineRegistry - Manages all QuietBuild OS engines
 *
 * Responsibilities:
 * - Register engines
 * - Resolve dependencies
 * - Initialize engines in correct order
 * - Start/stop all engines
 * - Health monitoring
 */

import { Engine, EngineMetadata, EngineContext, EngineConfig } from './engine';
import { EventBus } from '@qbos/events';

export interface RegistryConfig {
  /** Event bus instance */
  eventBus: EventBus;

  /** Default configuration for all engines */
  defaultConfig?: EngineConfig;

  /** Per-engine configuration overrides */
  engineConfigs?: Record<string, EngineConfig>;
}

export class EngineRegistry {
  private engines: Map<string, Engine> = new Map();
  private config: RegistryConfig;
  private initializationOrder: string[] = [];

  constructor(config: RegistryConfig) {
    this.config = config;
  }

  /**
   * Register an engine
   */
  register(engine: Engine): void {
    const id = engine.metadata.id;

    if (this.engines.has(id)) {
      throw new Error(`Engine ${id} already registered`);
    }

    this.engines.set(id, engine);
    console.log(`📦 Registered engine: ${engine.metadata.name} (${id})`);
  }

  /**
   * Get engine by ID
   */
  get(id: string): Engine | undefined {
    return this.engines.get(id);
  }

  /**
   * Get all engines
   */
  getAll(): Engine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get engine metadata
   */
  getMetadata(id: string): EngineMetadata | undefined {
    return this.engines.get(id)?.metadata;
  }

  /**
   * Initialize all engines in dependency order
   */
  async initializeAll(): Promise<void> {
    console.log('\n🚀 Initializing QuietBuild OS engines...\n');

    // Resolve initialization order based on dependencies
    this.initializationOrder = this.resolveInitializationOrder();

    console.log('📋 Initialization order:', this.initializationOrder.join(' → '));
    console.log();

    // Initialize engines in order
    for (const engineId of this.initializationOrder) {
      const engine = this.engines.get(engineId);
      if (!engine) continue;

      const engineConfig = this.getEngineConfig(engineId);

      if (!engineConfig.enabled) {
        console.log(`⏭️  Skipping ${engine.metadata.name} (disabled)`);
        continue;
      }

      const context: EngineContext = {
        eventBus: this.config.eventBus,
        config: engineConfig,
      };

      try {
        await engine.initialize(context);
      } catch (error: any) {
        console.error(`❌ Failed to initialize ${engineId}:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ All engines initialized\n');
  }

  /**
   * Start all initialized engines
   */
  async startAll(): Promise<void> {
    console.log('🚀 Starting all engines...\n');

    for (const engineId of this.initializationOrder) {
      const engine = this.engines.get(engineId);
      if (!engine) continue;

      const engineConfig = this.getEngineConfig(engineId);
      if (!engineConfig.enabled) continue;

      try {
        await engine.start();
      } catch (error: any) {
        console.error(`❌ Failed to start ${engineId}:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ All engines started\n');
  }

  /**
   * Stop all engines (in reverse order)
   */
  async stopAll(): Promise<void> {
    console.log('\n🛑 Stopping all engines...\n');

    // Stop in reverse order
    const reverseOrder = [...this.initializationOrder].reverse();

    for (const engineId of reverseOrder) {
      const engine = this.engines.get(engineId);
      if (!engine) continue;

      try {
        await engine.stop();
      } catch (error: any) {
        console.error(`❌ Failed to stop ${engineId}:`, error.message);
        // Continue stopping other engines
      }
    }

    console.log('✅ All engines stopped\n');
  }

  /**
   * Health check for all engines
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [id, engine] of this.engines) {
      try {
        results[id] = await engine.healthCheck();
      } catch {
        results[id] = false;
      }
    }

    return results;
  }

  /**
   * Resolve initialization order based on dependencies
   *
   * Uses topological sort to ensure dependencies are initialized first.
   */
  private resolveInitializationOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected: ${id}`);
      }

      visiting.add(id);

      const engine = this.engines.get(id);
      if (engine?.metadata.dependencies) {
        for (const depId of engine.metadata.dependencies) {
          if (!this.engines.has(depId)) {
            throw new Error(`Missing dependency: ${id} depends on ${depId}`);
          }
          visit(depId);
        }
      }

      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    // Visit all engines
    for (const id of this.engines.keys()) {
      visit(id);
    }

    return order;
  }

  /**
   * Get engine configuration (with defaults)
   */
  private getEngineConfig(engineId: string): EngineConfig {
    const defaultConfig: EngineConfig = {
      enabled: true,
      ...this.config.defaultConfig,
    };

    const engineConfig = this.config.engineConfigs?.[engineId];

    return {
      ...defaultConfig,
      ...engineConfig,
    };
  }
}
