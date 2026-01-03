"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const base_provider_1 = require("./base-provider");
class GoogleProvider extends base_provider_1.BaseProvider {
    client;
    constructor(config) {
        super('google');
        this.client = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
    }
    async generate(request) {
        const startTime = Date.now();
        try {
            const model = this.client.getGenerativeModel({ model: request.model });
            // Convert messages to Gemini format
            const systemPrompt = request.messages.find(m => m.role === 'system')?.content;
            const chatMessages = request.messages
                .filter(m => m.role !== 'system')
                .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));
            // Build generation config
            const generationConfig = {
                maxOutputTokens: request.maxTokens ?? 8192,
                temperature: request.temperature ?? 1.0,
            };
            // Start chat
            const chat = model.startChat({
                history: chatMessages.slice(0, -1),
                generationConfig,
                systemInstruction: systemPrompt,
            });
            // Send last message
            const lastMessage = chatMessages[chatMessages.length - 1];
            const result = await chat.sendMessage(lastMessage.parts[0].text);
            const response = result.response;
            const latency = Date.now() - startTime;
            // Calculate cost
            const inputTokens = response.usageMetadata?.promptTokenCount || 0;
            const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
            const inputCost = this.getInputCost(request.model, inputTokens);
            const outputCost = this.getOutputCost(request.model, outputTokens);
            const totalCost = inputCost + outputCost;
            return {
                text: response.text(),
                finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
                usage: {
                    inputTokens,
                    outputTokens,
                    totalTokens: inputTokens + outputTokens,
                },
                cost: totalCost,
                latency,
                model: request.model,
                provider: 'google',
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            // Handle rate limits
            if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                throw new Error('RATE_LIMITED');
            }
            // Handle timeouts
            if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
                throw new Error('TIMEOUT');
            }
            throw error;
        }
    }
    mapFinishReason(reason) {
        const mapping = {
            'STOP': 'stop',
            'MAX_TOKENS': 'length',
            'SAFETY': 'content_filter',
            'RECITATION': 'content_filter',
        };
        return mapping[reason || 'STOP'] || 'stop';
    }
    getAvailableModels() {
        return [
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-pro',
        ];
    }
    getModelCapabilities(model) {
        const baseCapabilities = [
            'long_context',
            'tool_use',
            'vision',
            'streaming',
        ];
        if (model.includes('pro') && !model.includes('flash')) {
            return [...baseCapabilities, 'code_generation', 'strong_reasoning'];
        }
        if (model.includes('flash')) {
            return [...baseCapabilities, 'code_generation', 'low_cost', 'fast_latency'];
        }
        return baseCapabilities;
    }
    getInputCost(model, tokens) {
        const costsPer1M = {
            'gemini-1.5-pro': 3.50,
            'gemini-1.5-flash': 0.35,
            'gemini-pro': 0.50,
        };
        const modelKey = Object.keys(costsPer1M).find(k => model.includes(k)) || 'gemini-pro';
        const costPer1M = costsPer1M[modelKey];
        return (tokens / 1_000_000) * costPer1M;
    }
    getOutputCost(model, tokens) {
        const costsPer1M = {
            'gemini-1.5-pro': 10.50,
            'gemini-1.5-flash': 1.05,
            'gemini-pro': 1.50,
        };
        const modelKey = Object.keys(costsPer1M).find(k => model.includes(k)) || 'gemini-pro';
        const costPer1M = costsPer1M[modelKey];
        return (tokens / 1_000_000) * costPer1M;
    }
    async isHealthy() {
        try {
            const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
            await model.generateContent('test');
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.GoogleProvider = GoogleProvider;
//# sourceMappingURL=google-provider.js.map