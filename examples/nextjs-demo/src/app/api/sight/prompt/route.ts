import { createSightEnginePromptRoute } from '@qbos/nextjs-adapter';

export const POST = createSightEnginePromptRoute({
  requireAuth: false,
});
