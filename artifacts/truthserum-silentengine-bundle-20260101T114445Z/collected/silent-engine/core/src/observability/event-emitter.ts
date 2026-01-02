/**
 * SilentEngine™ - Event Emitter
 *
 * Pub/sub system for observability and integration hooks
 */

export interface SilentEngineEvent {
  eventType: string;
  timestamp: Date;
  payload: Record<string, any>;
}

export type EventHandler = (event: SilentEngineEvent) => void | Promise<void>;

export class EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register event handler
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Emit event
   */
  async emit(eventType: string, payload: Record<string, any>): Promise<void> {
    const event: SilentEngineEvent = {
      eventType,
      timestamp: new Date(),
      payload,
    };

    const handlers = this.handlers.get(eventType) || [];

    // Execute all handlers (fire-and-forget for observability)
    await Promise.allSettled(handlers.map((handler) => handler(event)));
  }

  /**
   * Remove handler
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Remove all handlers
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}
