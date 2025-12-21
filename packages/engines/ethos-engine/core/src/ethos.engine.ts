import type { EventBus } from '@qbos/events';
import type { EthosEngineConfig } from './types';

export class EthosEngine {
  private config: EthosEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<EthosEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('EthosEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[EthosEngine] Engine is disabled');
      return;
    }

    console.log('[EthosEngine] Initializing...');
    this.initialized = true;
    console.log('[EthosEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[EthosEngine] Shutting down...');
    this.initialized = false;
    console.log('[EthosEngine] Shutdown complete');
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

  getConfig(): Readonly<EthosEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`ethos.${eventType}`, payload).catch((error: any) => {
        console.error(`[EthosEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { EthosEngineConfig };
