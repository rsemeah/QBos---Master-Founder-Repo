import { NextRequest, NextResponse } from 'next/server';
import { SilentEngine } from '@qbos/silent-engine-core';
import { z } from 'zod';

// Request validation schema
const generateRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  maxCost: z.number().optional(),
  maxLatency: z.number().optional(),
  preferredCapabilities: z.array(z.string()).optional(),
  requiredCapabilities: z.array(z.string()).optional(),
  policyKey: z.string().optional(),
});

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
export function createSilentEngineRoute(config: SilentEngineRouteConfig) {
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
      const validationResult = generateRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
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
      return NextResponse.json({
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
      
    } catch (error: any) {
      console.error('SilentEngine route error:', error);
      
      // Error callback
      if (config.onError) {
        await config.onError(error, undefined);
      }
      
      // Handle specific errors
      if (error.message === 'RATE_LIMITED') {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message === 'TIMEOUT') {
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        );
      }
      
      if (error.message?.includes('No suitable provider')) {
        return NextResponse.json(
          { error: 'No suitable AI provider available for your request.' },
          { status: 503 }
        );
      }
      
      // Generic error
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
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
export function createSilentEngineStreamRoute(config: SilentEngineRouteConfig) {
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
      const validationResult = generateRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
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
          } catch (error: any) {
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
      
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
      
    } catch (error: any) {
      console.error('SilentEngine stream route error:', error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
