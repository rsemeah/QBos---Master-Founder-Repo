import type { EventBus } from '@qbos/events';
import type { TestingEngineConfig } from './types';

export class TestingEngine {
  private config: TestingEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<TestingEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('TestingEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[TestingEngine] Engine is disabled');
      return;
    }

    console.log('[TestingEngine] Initializing...');
    this.initialized = true;
    console.log('[TestingEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[TestingEngine] Shutting down...');
    this.initialized = false;
    console.log('[TestingEngine] Shutdown complete');
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

  getConfig(): Readonly<TestingEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`testing.${eventType}`, payload).catch((error: any) => {
        console.error(`[TestingEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { TestingEngineConfig };
