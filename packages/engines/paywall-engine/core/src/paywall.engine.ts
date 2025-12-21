import type { EventBus } from '@qbos/events';
import type { PaywallEngineConfig } from './types';

export class PaywallEngine {
  private config: PaywallEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: Partial<PaywallEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('PaywallEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[PaywallEngine] Engine is disabled');
      return;
    }

    console.log('[PaywallEngine] Initializing...');
    this.initialized = true;
    console.log('[PaywallEngine] Initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[PaywallEngine] Shutting down...');
    this.initialized = false;
    console.log('[PaywallEngine] Shutdown complete');
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

  getConfig(): Readonly<PaywallEngineConfig> {
    return { ...this.config };
  }

  protected emitEvent(eventType: string, payload: any): void {
    setImmediate(() => {
      this.eventBus.emit(`paywall.${eventType}`, payload).catch((error: any) => {
        console.error(`[PaywallEngine] Failed to emit event:`, error);
      });
    });
  }
}

export type { PaywallEngineConfig };
