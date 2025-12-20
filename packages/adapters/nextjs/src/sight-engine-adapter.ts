import { NextRequest, NextResponse } from 'next/server';
import { validateAsset, generatePromptHeader, AssetSpec } from '@qbos/sight-engine';
import { z } from 'zod';

// Validation request schema
const validateRequestSchema = z.object({
  assetSpec: z.object({
    resolutionWidth: z.number(),
    resolutionHeight: z.number(),
    cameraModel: z.string().optional(),
    lensType: z.string().optional(),
    aperture: z.number().optional(),
    colorSpace: z.string().optional(),
    bitDepth: z.number().optional(),
    lightingStyle: z.string().optional(),
    hasAIArtifacts: z.boolean().optional(),
    hasFlatLighting: z.boolean().optional(),
    hasOversaturation: z.boolean().optional(),
    hasUpscaleArtifacts: z.boolean().optional(),
  }),
  assetType: z.enum([
    'hero-image',
    'product-shot',
    'brand-visual',
    'logo',
    'icon',
    'background',
    'character',
    'environment'
  ]),
  tier: z.enum(['A', 'B', 'C']),
});

// Prompt generation request schema
const promptRequestSchema = z.object({
  tier: z.enum(['A', 'B', 'C']),
  assetType: z.enum([
    'hero-image',
    'product-shot',
    'brand-visual',
    'logo',
    'icon',
    'background',
    'character',
    'environment'
  ]).optional(),
});

export type SightEngineRouteConfig = {
  requireAuth?: boolean;
  getUserId?: (req: NextRequest) => Promise<string | null>;
  onValidation?: (result: any, userId?: string) => Promise<void>;
};

/**
 * Creates a Next.js API route handler for SightEngine asset validation
 * 
 * @example
 * ```typescript
 * // app/api/sight/validate/route.ts
 * import { createSightEngineValidateRoute } from '@qbos/nextjs-adapter';
 * 
 * export const POST = createSightEngineValidateRoute({
 *   requireAuth: true,
 *   getUserId: async (req) => {
 *     // Get user from session/token
 *     return 'user-id';
 *   }
 * });
 * ```
 */
export function createSightEngineValidateRoute(config: SightEngineRouteConfig = {}) {
  return async (req: NextRequest) => {
    try {
      // Authentication check
      let userId: string | null = null;
      if (config.requireAuth && config.getUserId) {
        userId = await config.getUserId(req);
        if (!userId) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      }
      
      // Parse request body
      const body = await req.json();
      
      // Validate request
      const validationResult = validateRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
      }
      
      const { assetSpec, assetType, tier } = validationResult.data;
      
      // Validate asset using SightEngine
      const result = validateAsset(assetSpec as AssetSpec, assetType, tier);
      
      // Callback
      if (config.onValidation) {
        await config.onValidation(result, userId || undefined);
      }
      
      // Return response
      return NextResponse.json({
        success: true,
        data: result
      });
      
    } catch (error: any) {
      console.error('SightEngine validate route error:', error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Creates a Next.js API route handler for SightEngine prompt generation
 * 
 * @example
 * ```typescript
 * // app/api/sight/prompt/route.ts
 * import { createSightEnginePromptRoute } from '@qbos/nextjs-adapter';
 * 
 * export const POST = createSightEnginePromptRoute();
 * ```
 */
export function createSightEnginePromptRoute(config: SightEngineRouteConfig = {}) {
  return async (req: NextRequest) => {
    try {
      // Authentication check
      let userId: string | null = null;
      if (config.requireAuth && config.getUserId) {
        userId = await config.getUserId(req);
        if (!userId) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      }
      
      // Parse request body
      const body = await req.json();
      
      // Validate request
      const validationResult = promptRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
      }
      
      const { tier, assetType } = validationResult.data;
      
      // Generate prompt header using SightEngine
      const promptHeader = generatePromptHeader(tier, assetType);
      
      // Return response
      return NextResponse.json({
        success: true,
        data: {
          tier,
          assetType: assetType || 'general',
          promptHeader
        }
      });
      
    } catch (error: any) {
      console.error('SightEngine prompt route error:', error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Creates a combined route that validates an asset AND generates an AI prompt if validation fails
 * 
 * @example
 * ```typescript
 * // app/api/sight/validate-and-suggest/route.ts
 * import { createSightEngineValidateAndSuggestRoute } from '@qbos/nextjs-adapter';
 * 
 * export const POST = createSightEngineValidateAndSuggestRoute();
 * ```
 */
export function createSightEngineValidateAndSuggestRoute(config: SightEngineRouteConfig = {}) {
  return async (req: NextRequest) => {
    try {
      // Authentication check
      let userId: string | null = null;
      if (config.requireAuth && config.getUserId) {
        userId = await config.getUserId(req);
        if (!userId) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      }
      
      // Parse request body
      const body = await req.json();
      
      // Validate request
      const validationResult = validateRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
      }
      
      const { assetSpec, assetType, tier } = validationResult.data;
      
      // Validate asset
      const validation = validateAsset(assetSpec as AssetSpec, assetType, tier);
      
      // Callback
      if (config.onValidation) {
        await config.onValidation(validation, userId || undefined);
      }
      
      let suggestion = null;
      
      // If validation failed, generate a suggestion prompt
      if (!validation.passed) {
        const promptHeader = generatePromptHeader(tier, assetType);
        
        // Create improvement suggestions based on issues
        const improvements = validation.issues.map(issue => {
          if (issue.includes('resolution')) {
            return 'Increase resolution to meet tier requirements';
          }
          if (issue.includes('camera')) {
            return 'Use professional cinema cameras (ARRI Alexa 65 or RED V-Raptor)';
          }
          if (issue.includes('lighting')) {
            return 'Improve lighting to cinematic standards (three-point or Rembrandt)';
          }
          if (issue.includes('AI artifacts')) {
            return 'Remove AI artifacts and ensure photorealistic quality';
          }
          return issue;
        });
        
        suggestion = {
          promptHeader,
          improvements,
          recommendedStandards: `Use ${promptHeader} to regenerate this asset with proper quality standards.`
        };
      }
      
      // Return combined response
      return NextResponse.json({
        success: true,
        data: {
          validation,
          suggestion
        }
      });
      
    } catch (error: any) {
      console.error('SightEngine validate-and-suggest route error:', error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
