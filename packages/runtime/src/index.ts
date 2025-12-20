/**
 * @qbos/runtime - QuietBuild OS Runtime Package
 *
 * Engine orchestration, lifecycle management, and bootstrap.
 *
 * Usage:
 *
 * ```typescript
 * import { bootstrap, BaseEngine } from '@qbos/runtime';
 *
 * // Define an engine
 * class MyEngine extends BaseEngine {
 *   metadata = {
 *     id: 'my-engine',
 *     name: 'My Engine',
 *     version: '1.0.0',
 *     description: 'Does something cool',
 *   };
 *
 *   protected async onInitialize() {
 *     this.on('user.created', async (event) => {
 *       console.log('User created:', event.payload);
 *     });
 *   }
 *
 *   protected async onStart() {
 *     console.log('My engine started!');
 *   }
 *
 *   protected async onStop() {
 *     console.log('My engine stopped!');
 *   }
 *
 *   protected async onHealthCheck() {
 *     return true;
 *   }
 * }
 *
 * // Bootstrap the system
 * const qbos = await bootstrap(
 *   {
 *     supabaseUrl: process.env.SUPABASE_URL!,
 *     supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
 *   },
 *   [new MyEngine()]
 * );
 *
 * // Start QuietBuild OS
 * await qbos.start();
 * ```
 */

// Core engine types
export {
  Engine,
  EngineMetadata,
  EngineConfig,
  EngineContext,
  BaseEngine,
} from './engine';

// Engine registry
export { EngineRegistry, RegistryConfig } from './registry';

// Bootstrap
export {
  bootstrap,
  run,
  loadConfigFromEnv,
  BootstrapConfig,
  QuietBuildOS,
} from './bootstrap';
