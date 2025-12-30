import { NextRequest, NextResponse } from 'next/server';
import {
  validateAsset,
  generatePromptHeader,
  AssetSpec,
  STANDARD_RESOLUTIONS,
} from '@qbos/sight-engine';
import { z } from 'zod';

// Validation request schema
const validateRequestSchema = z.object({
  assetSpec: z.object({
    resolutionWidth: z.number(),
    resolutionHeight: z.number(),
    cameraModel: z.string().optional(),
    lensType: z.string().optional(),
    aperture: z.number().optional(),
    colorSpace: z.enum([
      'ACEScg',
      'Display-P3',
      'sRGB',
      'Rec-709',
      'Rec-2020',
      'DCI-P3',
    ]).optional(),
    bitDepth: z.number().optional(),
    lightingStyle: z.string().optional(),
    colorTemperature: z.number().optional(),
    contrast: z.enum(['low', 'medium', 'high']).optional(),
    hasAIArtifacts: z.boolean().optional(),
    hasFlatLighting: z.boolean().optional(),
    hasOversaturation: z.boolean().optional(),
    hasUpscaleArtifacts: z.boolean().optional(),
  }),
  assetType: z.enum([
    'hero-image',
    'logo',
    'screenshot',
    'diagram',
    'video',
    'thumbnail',
    'icon',
  ]),
  tier: z.enum(['A', 'B', 'C']),
});

// Prompt generation request schema
const promptRequestSchema = z.object({
  tier: z.enum(['A', 'B', 'C']),
  assetType: z.enum([
    'hero-image',
    'logo',
    'screenshot',
    'diagram',
    'video',
    'thumbnail',
    'icon',
  ]).optional(),
});

const aspectRatioOptions: Array<{ label: AssetSpec['aspectRatio']; ratio: number }> = [
  { label: '16:9', ratio: 16 / 9 },
  { label: '21:9', ratio: 21 / 9 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '1:1', ratio: 1 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '2.39:1', ratio: 2.39 },
];

const resolveAspectRatio = (width: number, height: number): AssetSpec['aspectRatio'] => {
  const ratio = width / height;
  const closest = aspectRatioOptions.reduce((best, option) => {
    const diff = Math.abs(option.ratio - ratio);
    if (!best || diff < best.diff) {
      return { label: option.label, diff };
    }
    return best;
  }, null as null | { label: AssetSpec['aspectRatio']; diff: number });

  return closest ? closest.label : '16:9';
};

const resolveResolution = (width: number, height: number) => {
  const entries = Object.values(STANDARD_RESOLUTIONS);
  const closest = entries.reduce((best, option) => {
    const diff = Math.abs(option.width - width) + Math.abs(option.height - height);
    if (!best || diff < best.diff) {
      return { value: option, diff };
    }
    return best;
  }, null as null | { value: (typeof entries)[number]; diff: number });

  return closest ? closest.value : STANDARD_RESOLUTIONS['HD'];
};

const resolveLightingSetup = (style?: string): AssetSpec['lighting']['setup'] => {
  const normalized = style?.toLowerCase() ?? '';
  if (normalized.includes('natural')) return 'natural-window';
  if (normalized.includes('rembrandt')) return 'rembrandt';
  if (normalized.includes('butterfly')) return 'butterfly';
  if (normalized.includes('broad')) return 'broad';
  if (normalized.includes('dramatic')) return 'hard-dramatic';
  return 'three-point';
};

const resolveBitDepth = (bitDepth?: number): AssetSpec['bitDepth'] => {
  const allowed: AssetSpec['bitDepth'][] = [8, 10, 12, 16, 32];
  if (bitDepth && allowed.includes(bitDepth as AssetSpec['bitDepth'])) {
    return bitDepth as AssetSpec['bitDepth'];
  }
  return 8;
};

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

      const resolvedResolution = resolveResolution(
        assetSpec.resolutionWidth,
        assetSpec.resolutionHeight
      );

      const resolvedSpec: AssetSpec = {
        resolution: resolvedResolution,
        aspectRatio: resolveAspectRatio(
          assetSpec.resolutionWidth,
          assetSpec.resolutionHeight
        ),
        camera: {
          model: (assetSpec.cameraModel as AssetSpec['camera']['model']) ?? 'simulated-cinematic',
          lens: (assetSpec.lensType as AssetSpec['camera']['lens']) ?? '50mm-prime',
          aperture: assetSpec.aperture ?? 2.8,
        },
        colorSpace: assetSpec.colorSpace ?? 'sRGB',
        bitDepth: resolveBitDepth(assetSpec.bitDepth),
        lighting: {
          setup: resolveLightingSetup(assetSpec.lightingStyle),
          keyLight: { type: 'key', intensity: 70, softness: 'medium' },
          colorTemperature: assetSpec.colorTemperature ?? 5600,
          contrast: assetSpec.contrast ?? 'medium',
        },
      };
      
      // Validate asset using SightEngine
      const result = validateAsset(resolvedSpec, assetType, tier);
      
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
      const promptHeader = generatePromptHeader(tier);
      
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
      const resolvedResolution = resolveResolution(
        assetSpec.resolutionWidth,
        assetSpec.resolutionHeight
      );

      const resolvedSpec: AssetSpec = {
        resolution: resolvedResolution,
        aspectRatio: resolveAspectRatio(
          assetSpec.resolutionWidth,
          assetSpec.resolutionHeight
        ),
        camera: {
          model: (assetSpec.cameraModel as AssetSpec['camera']['model']) ?? 'simulated-cinematic',
          lens: (assetSpec.lensType as AssetSpec['camera']['lens']) ?? '50mm-prime',
          aperture: assetSpec.aperture ?? 2.8,
        },
        colorSpace: assetSpec.colorSpace ?? 'sRGB',
        bitDepth: resolveBitDepth(assetSpec.bitDepth),
        lighting: {
          setup: resolveLightingSetup(assetSpec.lightingStyle),
          keyLight: { type: 'key', intensity: 70, softness: 'medium' },
          colorTemperature: assetSpec.colorTemperature ?? 5600,
          contrast: assetSpec.contrast ?? 'medium',
        },
      };

      const validation = validateAsset(resolvedSpec, assetType, tier);
      
      // Callback
      if (config.onValidation) {
        await config.onValidation(validation, userId || undefined);
      }
      
      let suggestion = null;
      
      // If validation failed, generate a suggestion prompt
      if (!validation.passed) {
        const promptHeader = generatePromptHeader(tier);
        
        // Create improvement suggestions based on issues
        const issues = [...validation.errors, ...validation.warnings];
        const improvements = issues.map(issue => {
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
