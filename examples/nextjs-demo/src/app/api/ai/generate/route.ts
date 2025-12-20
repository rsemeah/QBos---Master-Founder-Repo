import { createSilentEngineRoute } from '@qbos/nextjs-adapter';
import { silentEngine } from '@/lib/silent-engine';

export const POST = createSilentEngineRoute({
  engine: silentEngine,
  requireAuth: false, // Set to true in production
  onSuccess: async (result) => {
    console.log('✅ Generation successful:', {
      provider: result.provider,
      model: result.model,
      cost: result.actualCost,
      latency: result.actualLatency,
    });
  },
  onError: async (error) => {
    console.error('❌ Generation failed:', error.message);
  },
});
