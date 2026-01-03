"use strict";
/**
 * MockProvider - Minimal Provider for Testing
 *
 * Returns canned responses without external API calls.
 * Used to prove SilentEngine integration without requiring API keys.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockProvider = void 0;
class MockProvider {
    providerKey = 'mock';
    displayName = 'Mock Provider';
    configured = false;
    configure(config) {
        this.configured = true;
    }
    async generate(request) {
        if (!this.configured) {
            throw new Error('Provider not configured');
        }
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        const userMessage = request.messages.find((m) => m.role === 'user')?.content || '';
        // Simple response generation
        const text = `Mock AI Response: I received your message "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}". This is a simulated response from the Mock Provider for testing purposes.`;
        return {
            text,
            tokensInput: Math.ceil(userMessage.length / 4), // ~4 chars per token
            tokensOutput: Math.ceil(text.length / 4),
            finishReason: 'stop',
            latencyMs: 50,
        };
    }
    async *generateStream(request) {
        const response = await this.generate(request);
        yield { text: response.text, isDone: true };
    }
    async healthCheck() {
        return {
            available: this.configured,
            latencyMs: 10,
            errorMessage: this.configured ? undefined : 'Not configured',
        };
    }
    getSupportedModels() {
        return [
            {
                modelKey: 'mock-standard',
                displayName: 'Mock Standard Model',
                providerKey: 'mock',
                capabilities: {
                    longContext: false,
                    toolUse: false,
                    vision: false,
                    streaming: true,
                    codeGeneration: true,
                    strongReasoning: false,
                    highQuality: false,
                    complexTasks: false,
                    lowCost: true,
                    fastLatency: true,
                    contextWindow: 8192,
                    maxOutputTokens: 2048,
                },
                costInputPerMTok: 0,
                costOutputPerMTok: 0,
                avgLatencyMs: 50,
                enabled: true,
            },
        ];
    }
}
exports.MockProvider = MockProvider;
//# sourceMappingURL=mock-provider.js.map