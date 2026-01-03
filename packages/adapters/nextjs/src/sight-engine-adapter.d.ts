import { NextRequest, NextResponse } from 'next/server';
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
export declare function createSightEngineValidateRoute(config?: SightEngineRouteConfig): (req: NextRequest) => Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    data: any;
}>>;
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
export declare function createSightEnginePromptRoute(config?: SightEngineRouteConfig): (req: NextRequest) => Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    data: {
        tier: "A" | "B" | "C";
        assetType: string;
        promptHeader: any;
    };
}>>;
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
export declare function createSightEngineValidateAndSuggestRoute(config?: SightEngineRouteConfig): (req: NextRequest) => Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    data: {
        validation: any;
        suggestion: {
            promptHeader: any;
            improvements: any[];
            recommendedStandards: string;
        } | null;
    };
}>>;
//# sourceMappingURL=sight-engine-adapter.d.ts.map