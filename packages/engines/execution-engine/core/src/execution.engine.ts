import type { EventBus } from '@qbos/events';
import type { ExecutionEngineConfig } from './types';

export class ExecutionEngine {
  private config: ExecutionEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<ExecutionEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('ExecutionEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[ExecutionEngine] Engine is disabled');
      return;
    }

    console.log('[ExecutionEngine] Initializing...');
    this.initialized = true;
    console.log('[ExecutionEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[ExecutionEngine] Shutting down...');
    this.initialized = false;
    console.log('[ExecutionEngine] Shutdown complete');
  }

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    if (!this.config.enabled) {
      return { ok: false, message: 'Engine is disabled' };
    }

    if (!this.initialized) {
      return { ok: false, message: 'Engine not initialized' };
    }

    return { ok: true };
  }

  getConfig(): Readonly<ExecutionEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`execution.${eventType}`, payload).catch((error: any) => {
        console.error(`[ExecutionEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { ExecutionEngineConfig };
