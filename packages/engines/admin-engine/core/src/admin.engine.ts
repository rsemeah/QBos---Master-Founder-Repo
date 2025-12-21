import type { EventBus } from '@qbos/events';
import type { AdminEngineConfig } from './types';

export class AdminEngine {
  private config: AdminEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<AdminEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('AdminEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[AdminEngine] Engine is disabled');
      return;
    }

    console.log('[AdminEngine] Initializing...');
    this.initialized = true;
    console.log('[AdminEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[AdminEngine] Shutting down...');
    this.initialized = false;
    console.log('[AdminEngine] Shutdown complete');
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

  getConfig(): Readonly<AdminEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`admin.${eventType}`, payload).catch((error: any) => {
        console.error(`[AdminEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { AdminEngineConfig };
