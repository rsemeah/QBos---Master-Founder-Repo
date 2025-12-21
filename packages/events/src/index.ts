/**
 * @qbos/events - QuietBuild OS Event Bus Package
 *
 * Engine coordination layer for QuietBuild OS.
 * All engines communicate through the EventBus abstraction.
 *
 * Usage:
 *
 * ```typescript
 * // Development: In-memory event bus
 * import { InMemoryEventBus } from '@qbos/events';
 * const bus = new InMemoryEventBus();
 *
 * // Production: Database-driven event bus
 * import { DatabaseEventBus } from '@qbos/events';
 * const bus = new DatabaseEventBus({ supabase });
 *
 * // Subscribe to events
 * bus.on('user.created', async (event) => {
 *   console.log('New user:', event.payload);
 * });
 *
 * // Emit events
 * await bus.emit('user.created', { userId: '123', email: 'user@example.com' });
 *
 * // Start processing (required for DatabaseEventBus)
 * await bus.start();
 * ```
 */

// Core interfaces and types
export type {
  EventBus,
  Event,
  EventHandler,
  EventMetadata,
  EventBusOptions,
  EmitOptions,
} from './event-bus';

export {
  matchesPattern,
  generateEventId,
} from './event-bus';

// Adapters
export { InMemoryEventBus } from './adapters/in-memory';
export { DatabaseEventBus } from './adapters/database';
export type { DatabaseEventBusOptions } from './adapters/database';

// Re-export useful database types
export type { CoreEventName } from '@qbos/database';
export {
  generateIdempotencyKey,
  CORE_EVENTS,
} from '@qbos/database';
