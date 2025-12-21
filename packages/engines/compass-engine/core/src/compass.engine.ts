import type { EventBus } from '@qbos/events';
import type { CompassEngineConfig } from './types';

export class CompassEngine {
  private config: CompassEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<CompassEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('CompassEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[CompassEngine] Engine is disabled');
      return;
    }

    console.log('[CompassEngine] Initializing...');
    this.initialized = true;
    console.log('[CompassEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[CompassEngine] Shutting down...');
    this.initialized = false;
    console.log('[CompassEngine] Shutdown complete');
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

  getConfig(): Readonly<CompassEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`compass.${eventType}`, payload).catch((error: any) => {
        console.error(`[CompassEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { CompassEngineConfig };
