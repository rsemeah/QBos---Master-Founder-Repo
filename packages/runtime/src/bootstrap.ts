/**
 * Bootstrap - QuietBuild OS Application Startup
 *
 * This is the main entry point for initializing and starting QuietBuild OS.
 * It orchestrates the entire system lifecycle.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventBus, InMemoryEventBus, DatabaseEventBus } from '@qbos/events';
import { Database } from '@qbos/database';
import { Engine, EngineConfig } from './engine';
import { EngineRegistry } from './registry';

export interface BootstrapConfig {
  /** Supabase URL */
  supabaseUrl: string;

  /** Supabase service role key (required for event bus) */
  supabaseServiceRoleKey: string;

  /** Environment (development, production, test) */
  environment?: 'development' | 'production' | 'test';

  /** Use in-memory event bus (for testing) */
  useInMemoryEventBus?: boolean;

  /** Worker ID (for distributed deployments) */
  workerId?: string;

  /** Event bus poll interval (ms) */
  eventBusPollInterval?: number;

  /** Default engine configuration */
  defaultEngineConfig?: EngineConfig;

  /** Per-engine configuration overrides */
  engineConfigs?: Record<string, EngineConfig>;
}

export interface QuietBuildOS {
  /** Supabase client */
  supabase: SupabaseClient<Database>;

  /** Event bus */
  eventBus: EventBus;

  /** Engine registry */
  registry: EngineRegistry;

  /** Start the system */
  start(): Promise<void>;

  /** Stop the system */
  stop(): Promise<void>;

  /** Health check */
  healthCheck(): Promise<Record<string, boolean>>;
}

/**
 * Bootstrap QuietBuild OS
 *
 * Creates and configures all core services.
 */
export async function bootstrap(
  config: BootstrapConfig,
  engines: Engine[]
): Promise<QuietBuildOS> {
  console.log('\n🎯 QuietBuild OS - Bootstrap\n');
  console.log(`   Environment: ${config.environment || 'production'}`);
  console.log(`   Event Bus: ${config.useInMemoryEventBus ? 'In-Memory' : 'Database'}`);
  console.log(`   Engines: ${engines.length}\n`);

  // Create Supabase client
  const supabase = createClient<Database>(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  console.log('✅ Supabase client created');

  // Create Event Bus
  let eventBus: EventBus;

  if (config.useInMemoryEventBus) {
    eventBus = new InMemoryEventBus();
  } else {
    eventBus = new DatabaseEventBus({
      supabase,
      workerId: config.workerId,
      pollInterval: config.eventBusPollInterval,
    });
  }

  console.log('✅ Event bus created');

  // Create Engine Registry
  const registry = new EngineRegistry({
    eventBus,
    defaultConfig: config.defaultEngineConfig,
    engineConfigs: config.engineConfigs,
  });

  console.log('✅ Engine registry created');

  // Register all engines
  for (const engine of engines) {
    registry.register(engine);
  }

  console.log();

  // Initialize engines
  await registry.initializeAll();

  // Create QuietBuild OS instance
  const qbos: QuietBuildOS = {
    supabase,
    eventBus,
    registry,

    async start() {
      console.log('🚀 QuietBuild OS - Starting...\n');

      // Start event bus
      await eventBus.start();

      // Start all engines
      await registry.startAll();

      console.log('✅ QuietBuild OS is running!\n');
    },

    async stop() {
      console.log('🛑 QuietBuild OS - Shutting down...\n');

      // Stop all engines (in reverse order)
      await registry.stopAll();

      // Stop event bus
      await eventBus.stop();

      console.log('✅ QuietBuild OS stopped gracefully\n');
    },

    async healthCheck() {
      return registry.healthCheckAll();
    },
  };

  return qbos;
}

/**
 * Run QuietBuild OS with graceful shutdown
 *
 * This is a convenience wrapper that:
 * 1. Bootstraps the system
 * 2. Starts all engines
 * 3. Sets up graceful shutdown handlers
 * 4. Waits for termination signal
 */
export async function run(
  config: BootstrapConfig,
  engines: Engine[]
): Promise<void> {
  const qbos = await bootstrap(config, engines);

  // Start the system
  await qbos.start();

  // Setup graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
    await qbos.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep process alive
  console.log('✅ System ready. Press Ctrl+C to stop.\n');
  await new Promise(() => {}); // Wait forever
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): BootstrapConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    environment: (process.env.NODE_ENV as any) || 'production',
    useInMemoryEventBus: process.env.USE_IN_MEMORY_EVENT_BUS === 'true',
    workerId: process.env.WORKER_ID,
    eventBusPollInterval: process.env.EVENT_BUS_POLL_INTERVAL
      ? parseInt(process.env.EVENT_BUS_POLL_INTERVAL, 10)
      : undefined,
  };
}
