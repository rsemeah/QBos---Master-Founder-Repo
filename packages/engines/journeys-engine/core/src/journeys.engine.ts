import type { EventBus } from '@qbos/events';
import type { JourneysEngineConfig } from './types';

export class JourneysEngine {
  private config: JourneysEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<JourneysEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('JourneysEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[JourneysEngine] Engine is disabled');
      return;
    }

    console.log('[JourneysEngine] Initializing...');
    this.initialized = true;
    console.log('[JourneysEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[JourneysEngine] Shutting down...');
    this.initialized = false;
    console.log('[JourneysEngine] Shutdown complete');
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

  getConfig(): Readonly<JourneysEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`journeys.${eventType}`, payload).catch((error: any) => {
        console.error(`[JourneysEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { JourneysEngineConfig };
