import type { EventBus } from '@qbos/events';
import type { CommsEngineConfig } from './types';

export class CommsEngine {
  private config: CommsEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<CommsEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('CommsEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[CommsEngine] Engine is disabled');
      return;
    }

    console.log('[CommsEngine] Initializing...');
    this.initialized = true;
    console.log('[CommsEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[CommsEngine] Shutting down...');
    this.initialized = false;
    console.log('[CommsEngine] Shutdown complete');
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

  getConfig(): Readonly<CommsEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`comms.${eventType}`, payload).catch((error: any) => {
        console.error(`[CommsEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { CommsEngineConfig };
