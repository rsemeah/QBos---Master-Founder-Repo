import type { EventBus } from '@qbos/events';
import type { SubscriptionEngineConfig } from './types';

export class SubscriptionEngine {
  private config: SubscriptionEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<SubscriptionEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('SubscriptionEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[SubscriptionEngine] Engine is disabled');
      return;
    }

    console.log('[SubscriptionEngine] Initializing...');
    this.initialized = true;
    console.log('[SubscriptionEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[SubscriptionEngine] Shutting down...');
    this.initialized = false;
    console.log('[SubscriptionEngine] Shutdown complete');
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

  getConfig(): Readonly<SubscriptionEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`subscription.${eventType}`, payload).catch((error: any) => {
        console.error(`[SubscriptionEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { SubscriptionEngineConfig };
