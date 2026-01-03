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
export declare class EventEmitter {
    private handlers;
    /**
     * Register event handler
     */
    on(eventType: string, handler: EventHandler): void;
    /**
     * Emit event
     */
    emit(eventType: string, payload: Record<string, any>): Promise<void>;
    /**
     * Remove handler
     */
    off(eventType: string, handler: EventHandler): void;
    /**
     * Remove all handlers
     */
    removeAllListeners(eventType?: string): void;
}
//# sourceMappingURL=event-emitter.d.ts.map