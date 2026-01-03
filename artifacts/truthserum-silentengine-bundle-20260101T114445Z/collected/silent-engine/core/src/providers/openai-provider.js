"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_provider_1 = require("./base-provider");
class OpenAIProvider extends base_provider_1.BaseProvider {
    client;
    constructor(config) {
        super('openai');
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            organization: config.organization,
        });
    }
    async generate(request) {
        const startTime = Date.now();
        try {
            const response = await this.client.chat.completions.create({
                model: request.model,
                messages: request.messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                max_tokens: request.maxTokens,
                temperature: request.temperature ?? 1.0,
                stream: false,
            });
            const latency = Date.now() - startTime;
            // Calculate cost
            const inputCost = this.getInputCost(request.model, response.usage?.prompt_tokens || 0);
            const outputCost = this.getOutputCost(request.model, response.usage?.completion_tokens || 0);
            const totalCost = inputCost + outputCost;
            return {
                text: response.choices[0]?.message?.content || '',
                finishReason: response.choices[0]?.finish_reason || 'stop',
                usage: {
                    inputTokens: response.usage?.prompt_tokens || 0,
                    outputTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0,
                },
                cost: totalCost,
                latency,
                model: response.model,
                provider: 'openai',
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            // Handle rate limits
            if (error.status === 429) {
                throw new Error('RATE_LIMITED');
            }
            // Handle timeouts
            if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
                throw new Error('TIMEOUT');
            }
            throw error;
        }
    }
    getAvailableModels() {
        return [
            'gpt-4-turbo-2024-04-09',
            'gpt-4-turbo',
            'gpt-4o',
            'gpt-4',
            'gpt-3.5-turbo',
        ];
    }
    getModelCapabilities(model) {
        const baseCapabilities = [
            'tool_use',
            'streaming',
        ];
        if (model.includes('gpt-4')) {
            const gpt4Capabilities = [
                ...baseCapabilities,
                'long_context',
                'code_generation',
            ];
            if (model.includes('vision') || model.includes('turbo') || model === 'gpt-4o') {
                gpt4Capabilities.push('vision');
            }
            if (model === 'gpt-4o') {
                gpt4Capabilities.push('fast_latency');
            }
            return gpt4Capabilities;
        }
        if (model.includes('gpt-3.5')) {
            return [...baseCapabilities, 'low_cost', 'fast_latency'];
        }
        return baseCapabilities;
    }
    getInputCost(model, tokens) {
        const costsPer1M = {
            'gpt-4-turbo-2024-04-09': 10.00,
            'gpt-4-turbo': 10.00,
            'gpt-4o': 5.00,
            'gpt-4': 30.00,
            'gpt-3.5-turbo': 0.50,
        };
        // Find matching model or use default
        const modelKey = Object.keys(costsPer1M).find(k => model.includes(k)) || 'gpt-4';
        const costPer1M = costsPer1M[modelKey];
        return (tokens / 1_000_000) * costPer1M;
    }
    getOutputCost(model, tokens) {
        const costsPer1M = {
            'gpt-4-turbo-2024-04-09': 30.00,
            'gpt-4-turbo': 30.00,
            'gpt-4o': 15.00,
            'gpt-4': 60.00,
            'gpt-3.5-turbo': 1.50,
        };
        // Find matching model or use default
        const modelKey = Object.keys(costsPer1M).find(k => model.includes(k)) || 'gpt-4';
        const costPer1M = costsPer1M[modelKey];
        return (tokens / 1_000_000) * costPer1M;
    }
    async isHealthy() {
        try {
            await this.client.models.list();
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openai-provider.js.map