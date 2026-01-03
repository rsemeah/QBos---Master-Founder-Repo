import { NextRequest, NextResponse } from 'next/server';
import { SilentEngine } from '@qbos/silent-engine-core';
export type SilentEngineRouteConfig = {
    engine: SilentEngine;
    requireAuth?: boolean;
    getUserId?: (req: NextRequest) => Promise<string | null>;
    onSuccess?: (result: any, userId?: string) => Promise<void>;
    onError?: (error: Error, userId?: string) => Promise<void>;
};
/**
 * Creates a Next.js API route handler for SilentEngine
 *
 * @example
 * ```typescript
 * // app/api/ai/generate/route.ts
 * import { createSilentEngineRoute } from '@qbos/nextjs-adapter';
 * import { silentEngine } from '@/lib/silent-engine';
 *
 * export const POST = createSilentEngineRoute({
 *   engine: silentEngine,
 *   requireAuth: true,
 *   getUserId: async (req) => {
 *     // Get user from session/token
 *     return 'user-id';
 *   }
 * });
 * ```
 */
export declare function createSilentEngineRoute(config: SilentEngineRouteConfig): (req: NextRequest) => Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    data: {
        text: any;
        provider: any;
        model: any;
        cost: any;
        latency: any;
        tokenUsage: {
            input: any;
            output: any;
        };
        requestId: any;
    };
}>>;
/**
 * Creates a streaming Next.js API route handler for SilentEngine
 *
 * @example
 * ```typescript
 * // app/api/ai/stream/route.ts
 * import { createSilentEngineStreamRoute } from '@qbos/nextjs-adapter';
 * import { silentEngine } from '@/lib/silent-engine';
 *
 * export const POST = createSilentEngineStreamRoute({
 *   engine: silentEngine
 * });
 * ```
 */
export declare function createSilentEngineStreamRoute(config: SilentEngineRouteConfig): (req: NextRequest) => Promise<NextResponse<unknown>>;
//# sourceMappingURL=silent-engine-adapter.d.ts.map