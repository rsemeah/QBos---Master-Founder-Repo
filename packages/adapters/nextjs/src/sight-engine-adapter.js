"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSightEngineValidateRoute = createSightEngineValidateRoute;
exports.createSightEnginePromptRoute = createSightEnginePromptRoute;
exports.createSightEngineValidateAndSuggestRoute = createSightEngineValidateAndSuggestRoute;
const server_1 = require("next/server");
const sight_engine_1 = require("@qbos/sight-engine");
const zod_1 = require("zod");
// Validation request schema
const validateRequestSchema = zod_1.z.object({
    assetSpec: zod_1.z.object({
        resolutionWidth: zod_1.z.number(),
        resolutionHeight: zod_1.z.number(),
        cameraModel: zod_1.z.string().optional(),
        lensType: zod_1.z.string().optional(),
        aperture: zod_1.z.number().optional(),
        colorSpace: zod_1.z.enum([
            'ACEScg',
            'Display-P3',
            'sRGB',
            'Rec-709',
            'Rec-2020',
            'DCI-P3',
        ]).optional(),
        bitDepth: zod_1.z.number().optional(),
        lightingStyle: zod_1.z.string().optional(),
        colorTemperature: zod_1.z.number().optional(),
        contrast: zod_1.z.enum(['low', 'medium', 'high']).optional(),
        hasAIArtifacts: zod_1.z.boolean().optional(),
        hasFlatLighting: zod_1.z.boolean().optional(),
        hasOversaturation: zod_1.z.boolean().optional(),
        hasUpscaleArtifacts: zod_1.z.boolean().optional(),
    }),
    assetType: zod_1.z.enum([
        'hero-image',
        'logo',
        'screenshot',
        'diagram',
        'video',
        'thumbnail',
        'icon',
    ]),
    tier: zod_1.z.enum(['A', 'B', 'C']),
});
// Prompt generation request schema
const promptRequestSchema = zod_1.z.object({
    tier: zod_1.z.enum(['A', 'B', 'C']),
    assetType: zod_1.z.enum([
        'hero-image',
        'logo',
        'screenshot',
        'diagram',
        'video',
        'thumbnail',
        'icon',
    ]).optional(),
});
const aspectRatioOptions = [
    { label: '16:9', ratio: 16 / 9 },
    { label: '21:9', ratio: 21 / 9 },
    { label: '4:3', ratio: 4 / 3 },
    { label: '1:1', ratio: 1 },
    { label: '9:16', ratio: 9 / 16 },
    { label: '2.39:1', ratio: 2.39 },
];
const resolveAspectRatio = (width, height) => {
    const ratio = width / height;
    const closest = aspectRatioOptions.reduce((best, option) => {
        const diff = Math.abs(option.ratio - ratio);
        if (!best || diff < best.diff) {
            return { label: option.label, diff };
        }
        return best;
    }, null);
    return closest ? closest.label : '16:9';
};
const resolveResolution = (width, height) => {
    const entries = Object.values(sight_engine_1.STANDARD_RESOLUTIONS);
    const closest = entries.reduce((best, option) => {
        const diff = Math.abs(option.width - width) + Math.abs(option.height - height);
        if (!best || diff < best.diff) {
            return { value: option, diff };
        }
        return best;
    }, null);
    return closest ? closest.value : sight_engine_1.STANDARD_RESOLUTIONS['HD'];
};
const resolveLightingSetup = (style) => {
    const normalized = style?.toLowerCase() ?? '';
    if (normalized.includes('natural'))
        return 'natural-window';
    if (normalized.includes('rembrandt'))
        return 'rembrandt';
    if (normalized.includes('butterfly'))
        return 'butterfly';
    if (normalized.includes('broad'))
        return 'broad';
    if (normalized.includes('dramatic'))
        return 'hard-dramatic';
    return 'three-point';
};
const resolveBitDepth = (bitDepth) => {
    const allowed = [8, 10, 12, 16, 32];
    if (bitDepth && allowed.includes(bitDepth)) {
        return bitDepth;
    }
    return 8;
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
function createSightEngineValidateRoute(config = {}) {
    return async (req) => {
        try {
            // Authentication check
            let userId = null;
            if (config.requireAuth && config.getUserId) {
                userId = await config.getUserId(req);
                if (!userId) {
                    return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }
            // Parse request body
            const body = await req.json();
            // Validate request
            const validationResult = validateRequestSchema.safeParse(body);
            if (!validationResult.success) {
                return server_1.NextResponse.json({
                    error: 'Invalid request',
                    details: validationResult.error.errors
                }, { status: 400 });
            }
            const { assetSpec, assetType, tier } = validationResult.data;
            const resolvedResolution = resolveResolution(assetSpec.resolutionWidth, assetSpec.resolutionHeight);
            const resolvedSpec = {
                resolution: resolvedResolution,
                aspectRatio: resolveAspectRatio(assetSpec.resolutionWidth, assetSpec.resolutionHeight),
                camera: {
                    model: assetSpec.cameraModel ?? 'simulated-cinematic',
                    lens: assetSpec.lensType ?? '50mm-prime',
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
            const result = (0, sight_engine_1.validateAsset)(resolvedSpec, assetType, tier);
            // Callback
            if (config.onValidation) {
                await config.onValidation(result, userId || undefined);
            }
            // Return response
            return server_1.NextResponse.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('SightEngine validate route error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
function createSightEnginePromptRoute(config = {}) {
    return async (req) => {
        try {
            // Authentication check
            let userId = null;
            if (config.requireAuth && config.getUserId) {
                userId = await config.getUserId(req);
                if (!userId) {
                    return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }
            // Parse request body
            const body = await req.json();
            // Validate request
            const validationResult = promptRequestSchema.safeParse(body);
            if (!validationResult.success) {
                return server_1.NextResponse.json({
                    error: 'Invalid request',
                    details: validationResult.error.errors
                }, { status: 400 });
            }
            const { tier, assetType } = validationResult.data;
            // Generate prompt header using SightEngine
            const promptHeader = (0, sight_engine_1.generatePromptHeader)(tier);
            // Return response
            return server_1.NextResponse.json({
                success: true,
                data: {
                    tier,
                    assetType: assetType || 'general',
                    promptHeader
                }
            });
        }
        catch (error) {
            console.error('SightEngine prompt route error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
function createSightEngineValidateAndSuggestRoute(config = {}) {
    return async (req) => {
        try {
            // Authentication check
            let userId = null;
            if (config.requireAuth && config.getUserId) {
                userId = await config.getUserId(req);
                if (!userId) {
                    return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }
            // Parse request body
            const body = await req.json();
            // Validate request
            const validationResult = validateRequestSchema.safeParse(body);
            if (!validationResult.success) {
                return server_1.NextResponse.json({
                    error: 'Invalid request',
                    details: validationResult.error.errors
                }, { status: 400 });
            }
            const { assetSpec, assetType, tier } = validationResult.data;
            // Validate asset
            const resolvedResolution = resolveResolution(assetSpec.resolutionWidth, assetSpec.resolutionHeight);
            const resolvedSpec = {
                resolution: resolvedResolution,
                aspectRatio: resolveAspectRatio(assetSpec.resolutionWidth, assetSpec.resolutionHeight),
                camera: {
                    model: assetSpec.cameraModel ?? 'simulated-cinematic',
                    lens: assetSpec.lensType ?? '50mm-prime',
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
            const validation = (0, sight_engine_1.validateAsset)(resolvedSpec, assetType, tier);
            // Callback
            if (config.onValidation) {
                await config.onValidation(validation, userId || undefined);
            }
            let suggestion = null;
            // If validation failed, generate a suggestion prompt
            if (!validation.passed) {
                const promptHeader = (0, sight_engine_1.generatePromptHeader)(tier);
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
            return server_1.NextResponse.json({
                success: true,
                data: {
                    validation,
                    suggestion
                }
            });
        }
        catch (error) {
            console.error('SightEngine validate-and-suggest route error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    };
}
//# sourceMappingURL=sight-engine-adapter.js.map