/**
 * AI Service - OpenAI Integration for Rob
 *
 * Constitutional guarantees:
 * - Usage tracking (all token counts logged)
 * - Cost calculation (per model pricing)
 * - Error handling (graceful fallbacks)
 */
export interface AIGenerationRequest {
    sessionId: string;
    userMessage: string;
    conversationHistory: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
    state: string;
}
export interface AIGenerationResult {
    response: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    provider: string;
    model: string;
    latencyMs: number;
}
export declare function generateCodeWithAI(request: AIGenerationRequest): Promise<AIGenerationResult>;
//# sourceMappingURL=ai-service.d.ts.map