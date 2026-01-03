"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSilentEngineRoute = createSilentEngineRoute;
exports.createSilentEngineStreamRoute = createSilentEngineStreamRoute;
const server_1 = require("next/server");
const zod_1 = require("zod");
// Request validation schema
const generateRequestSchema = zod_1.z.object({
    messages: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['system', 'user', 'assistant']),
        content: zod_1.z.string()
    })),
    maxCost: zod_1.z.number().optional(),
    maxLatency: zod_1.z.number().optional(),
    preferredCapabilities: zod_1.z.array(zod_1.z.string()).optional(),
    requiredCapabilities: zod_1.z.array(zod_1.z.string()).optional(),
    policyKey: zod_1.z.string().optional(),
});
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
function createSilentEngineRoute(config) {
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
            const validationResult = generateRequestSchema.safeParse(body);
            if (!validationResult.success) {
                return server_1.NextResponse.json({
                    error: 'Invalid request',
                    details: validationResult.error.errors
                }, { status: 400 });
            }
            const request = validationResult.data;
            // Generate response using SilentEngine
            const result = await config.engine.generate({
                messages: request.messages,
                maxCost: request.maxCost,
                maxLatency: request.maxLatency,
                preferredCapabilities: request.preferredCapabilities,
                requiredCapabilities: request.requiredCapabilities,
                policyKey: request.policyKey,
            });
            // Success callback
            if (config.onSuccess) {
                await config.onSuccess(result, userId || undefined);
            }
            // Return response
            return server_1.NextResponse.json({
                success: true,
                data: {
                    text: result.response.text,
                    provider: result.provider,
                    model: result.model,
                    cost: result.actualCost,
                    latency: result.totalLatencyMs,
                    tokenUsage: {
                        input: result.response.tokensInput,
                        output: result.response.tokensOutput,
                    },
                    requestId: result.requestId,
                }
            });
        }
        catch (error) {
            console.error('SilentEngine route error:', error);
            // Error callback
            if (config.onError) {
                await config.onError(error, undefined);
            }
            // Handle specific errors
            if (error.message === 'RATE_LIMITED') {
                return server_1.NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
            }
            if (error.message === 'TIMEOUT') {
                return server_1.NextResponse.json({ error: 'Request timeout. Please try again.' }, { status: 504 });
            }
            if (error.message?.includes('No suitable provider')) {
                return server_1.NextResponse.json({ error: 'No suitable AI provider available for your request.' }, { status: 503 });
            }
            // Generic error
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    };
}
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
function createSilentEngineStreamRoute(config) {
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
            const validationResult = generateRequestSchema.safeParse(body);
            if (!validationResult.success) {
                return server_1.NextResponse.json({
                    error: 'Invalid request',
                    details: validationResult.error.errors
                }, { status: 400 });
            }
            const request = validationResult.data;
            // Create readable stream
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        // Generate with streaming
                        const result = await config.engine.generate({
                            messages: request.messages,
                            maxCost: request.maxCost,
                            maxLatency: request.maxLatency,
                            preferredCapabilities: request.preferredCapabilities,
                            requiredCapabilities: request.requiredCapabilities,
                            policyKey: request.policyKey,
                        });
                        // Send metadata first
                        const metadata = {
                            type: 'metadata',
                            provider: result.provider,
                            model: result.model,
                            requestId: result.requestId,
                        };
                        controller.enqueue(`data: ${JSON.stringify(metadata)}\n\n`);
                        // Send content
                        const content = {
                            type: 'content',
                            text: result.response.text,
                        };
                        controller.enqueue(`data: ${JSON.stringify(content)}\n\n`);
                        // Send completion
                        const completion = {
                            type: 'done',
                            cost: result.actualCost,
                            latency: result.totalLatencyMs,
                            tokenUsage: {
                                input: result.response.tokensInput,
                                output: result.response.tokensOutput,
                            },
                        };
                        controller.enqueue(`data: ${JSON.stringify(completion)}\n\n`);
                        controller.close();
                        // Success callback
                        if (config.onSuccess) {
                            await config.onSuccess(result, userId || undefined);
                        }
                    }
                    catch (error) {
                        const errorData = {
                            type: 'error',
                            error: error.message || 'Unknown error',
                        };
                        controller.enqueue(`data: ${JSON.stringify(errorData)}\n\n`);
                        controller.close();
                        if (config.onError) {
                            await config.onError(error, userId || undefined);
                        }
                    }
                },
            });
            return new server_1.NextResponse(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }
        catch (error) {
            console.error('SilentEngine stream route error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    };
}
//# sourceMappingURL=silent-engine-adapter.js.map