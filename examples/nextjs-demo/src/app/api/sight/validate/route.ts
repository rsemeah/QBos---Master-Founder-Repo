import { createSightEngineValidateRoute } from '@qbos/nextjs-adapter';

export const POST = createSightEngineValidateRoute({
  requireAuth: false, // Set to true in production
  onValidation: async (result) => {
    console.log('✅ Validation complete:', {
      passed: result.passed,
      score: result.score,
      issues: result.issues.length,
    });
  },
});
