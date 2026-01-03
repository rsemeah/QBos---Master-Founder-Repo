"use strict";
/**
 * Tests for SilentEngine (AI Router)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const silent_engine_1 = require("../silent-engine");
const createMockProvider = (params) => {
    const generate = jest.fn().mockResolvedValue({
        text: params.responseText,
        tokensInput: 120,
        tokensOutput: 240,
        finishReason: 'stop',
        latencyMs: 120,
    });
    const provider = {
        providerKey: params.providerKey,
        displayName: params.displayName,
        configure: jest.fn(),
        generate,
        generateStream: jest.fn(() => (async function* () {
            yield { text: params.responseText, isDone: true };
        })()),
        healthCheck: jest.fn().mockResolvedValue({ available: true, latencyMs: 25 }),
        getSupportedModels: jest.fn().mockReturnValue(params.models),
    };
    return { provider, generate };
};
const anthropicModels = [
    {
        modelKey: 'claude-3-5-sonnet',
        displayName: 'Claude 3.5 Sonnet',
        providerKey: 'anthropic',
        capabilities: {
            longContext: true,
            toolUse: true,
            vision: true,
            streaming: true,
            codeGeneration: true,
            strongReasoning: true,
            highQuality: true,
            complexTasks: true,
            lowCost: false,
            fastLatency: false,
            contextWindow: 200000,
            maxOutputTokens: 8192,
        },
        costInputPerMTok: 3.0,
        costOutputPerMTok: 15.0,
        enabled: true,
    },
];
const openAiModels = [
    {
        modelKey: 'gpt-4',
        displayName: 'GPT-4',
        providerKey: 'openai',
        capabilities: {
            longContext: false,
            toolUse: true,
            vision: false,
            streaming: true,
            codeGeneration: true,
            strongReasoning: false,
            highQuality: true,
            complexTasks: true,
            lowCost: false,
            fastLatency: true,
            contextWindow: 128000,
            maxOutputTokens: 4096,
        },
        costInputPerMTok: 10.0,
        costOutputPerMTok: 30.0,
        enabled: true,
    },
];
const mockPolicy = {
    policyKey: 'default',
    displayName: 'Default Policy',
    description: 'Prefer strong reasoning models with fallback.',
    maxCostPerRequest: 1.0,
    maxLatencyMs: 5000,
    preferredCapabilities: ['strong_reasoning'],
    requiredCapabilities: [],
    allowFallback: true,
    requireSafetyCheck: false,
    minSafetyLevel: 'low',
};
describe('SilentEngine (AI Router)', () => {
    let engine;
    let mockAnthropicProvider;
    let mockOpenAIProvider;
    let mockAnthropicGenerate;
    let mockOpenAIGenerate;
    beforeEach(() => {
        jest.clearAllMocks();
        const anthropic = createMockProvider({
            providerKey: 'anthropic',
            displayName: 'Anthropic',
            models: anthropicModels,
            responseText: 'Response from Claude',
        });
        const openai = createMockProvider({
            providerKey: 'openai',
            displayName: 'OpenAI',
            models: openAiModels,
            responseText: 'Response from GPT-4',
        });
        mockAnthropicProvider = anthropic.provider;
        mockOpenAIProvider = openai.provider;
        mockAnthropicGenerate = anthropic.generate;
        mockOpenAIGenerate = openai.generate;
        engine = new silent_engine_1.SilentEngine({
            providers: [mockAnthropicProvider, mockOpenAIProvider],
            policies: [mockPolicy],
            defaultPolicyKey: 'default',
        });
    });
    describe('generate', () => {
        it('should route to preferred provider', async () => {
            const request = {
                messages: [{ role: 'user', content: 'Hello' }],
                preferredCapabilities: ['strong_reasoning'],
            };
            const result = await engine.generate(request);
            expect(result.success).toBe(true);
            expect(result.provider).toBe('anthropic');
            expect(result.model).toBe('claude-3-5-sonnet');
            expect(mockAnthropicGenerate).toHaveBeenCalled();
        });
        it('should respect safety checks', async () => {
            const request = {
                messages: [{ role: 'user', content: 'How to hack a system' }],
                requiredCapabilities: ['strong_reasoning'],
                requireSafetyCheck: true,
            };
            await expect(engine.generate(request)).rejects.toThrow('Safety check failed');
        });
        it('should fallback to secondary provider on failure', async () => {
            mockAnthropicGenerate.mockRejectedValue(new Error('Provider unavailable'));
            const request = {
                messages: [{ role: 'user', content: 'Hello' }],
                requiredCapabilities: ['tool_use'],
            };
            const result = await engine.generate(request);
            expect(result.success).toBe(true);
            expect(result.provider).toBe('openai');
            expect(mockOpenAIGenerate).toHaveBeenCalled();
        });
        it('should calculate and enforce cost constraints', async () => {
            const expensiveRequest = {
                messages: [
                    {
                        role: 'user',
                        content: 'A'.repeat(100000),
                    },
                ],
                requiredCapabilities: ['strong_reasoning'],
            };
            await engine.generate(expensiveRequest);
            expect(mockAnthropicGenerate).toHaveBeenCalled();
        });
        it('should throw error when no policy found', async () => {
            const request = {
                messages: [{ role: 'user', content: 'Hello' }],
                requiredCapabilities: ['strong_reasoning'],
                policyKey: 'non-existent-policy',
            };
            await expect(engine.generate(request)).rejects.toThrow('Policy not found');
        });
        it('should emit events during execution', async () => {
            const eventSpy = jest.fn();
            engine.eventEmitter.on('silent.safety_check_completed', eventSpy);
            const request = {
                messages: [{ role: 'user', content: 'Hello' }],
                preferredCapabilities: ['strong_reasoning'],
            };
            await engine.generate(request);
            expect(eventSpy).toHaveBeenCalled();
        });
        it('should log audit trail', async () => {
            const request = {
                messages: [{ role: 'user', content: 'Hello' }],
                requiredCapabilities: ['strong_reasoning'],
            };
            const result = await engine.generate(request);
            expect(result.requestId).toBeDefined();
            expect(result.totalLatencyMs).toBeGreaterThan(0);
        });
    });
    describe('capability matching', () => {
        it('should select model with required capabilities', async () => {
            const request = {
                messages: [{ role: 'user', content: 'Analyze this image' }],
                requiredCapabilities: ['vision'],
            };
            const result = await engine.generate(request);
            expect(result.model).toBe('claude-3-5-sonnet');
        });
        it('should fail when no model has required capability', async () => {
            const request = {
                messages: [{ role: 'user', content: 'Test' }],
                requiredCapabilities: ['non_existent_capability'],
            };
            await expect(engine.generate(request)).rejects.toThrow();
        });
    });
    describe('circuit breaker', () => {
        it('should open circuit after repeated failures', async () => {
            mockAnthropicGenerate
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockRejectedValueOnce(new Error('Fail 3'))
                .mockRejectedValueOnce(new Error('Fail 4'))
                .mockRejectedValueOnce(new Error('Fail 5'));
            const request = {
                messages: [{ role: 'user', content: 'Hello' }],
                requiredCapabilities: ['tool_use'],
            };
            for (let i = 0; i < 5; i++) {
                try {
                    await engine.generate(request);
                }
                catch (e) {
                    // Expected failures
                }
            }
            const result = await engine.generate(request);
            expect(result.provider).toBe('openai');
        });
    });
    describe('provider management', () => {
        it('should list all available models', () => {
            const models = engine.getAllModels();
            expect(models.length).toBeGreaterThanOrEqual(2);
            expect(models.map((m) => m.modelKey)).toContain('claude-3-5-sonnet');
            expect(models.map((m) => m.modelKey)).toContain('gpt-4');
        });
        it('should route based on context window requirements', async () => {
            const largeContextRequest = {
                messages: [
                    {
                        role: 'user',
                        content: 'A'.repeat(150000),
                    },
                ],
                requiredCapabilities: ['long_context'],
            };
            const result = await engine.generate(largeContextRequest);
            expect(result.model).toBe('claude-3-5-sonnet');
        });
    });
});
//# sourceMappingURL=silent-engine.test.js.map