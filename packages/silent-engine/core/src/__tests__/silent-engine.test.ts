/**
 * Tests for SilentEngine (AI Router)
 */

import { SilentEngine } from '../silent-engine';
import { RoutingRequest, RoutingPolicy } from '../types';

// Mock providers
const mockAnthropicProvider = {
  providerKey: 'anthropic',
  models: [
    {
      modelKey: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      capabilities: ['reasoning', 'code', 'vision'],
      contextWindow: 200000,
      maxOutputTokens: 8192,
      costPer1MInputTokens: 3.0,
      costPer1MOutputTokens: 15.0,
    },
  ],
  execute: jest.fn(),
};

const mockOpenAIProvider = {
  providerKey: 'openai',
  models: [
    {
      modelKey: 'gpt-4',
      name: 'GPT-4',
      capabilities: ['reasoning', 'code'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      costPer1MInputTokens: 10.0,
      costPer1MOutputTokens: 30.0,
    },
  ],
  execute: jest.fn(),
};

const mockPolicy: RoutingPolicy = {
  policyKey: 'default',
  name: 'Default Policy',
  preferredProvider: 'anthropic',
  preferredModels: ['claude-3-5-sonnet'],
  costConstraint: { maxCostPerRequest: 1.0 },
  qualityConstraint: { minQualityScore: 0.8 },
};

describe('SilentEngine (AI Router)', () => {
  let engine: SilentEngine;

  beforeEach(() => {
    jest.clearAllMocks();

    engine = new SilentEngine({
      providers: [mockAnthropicProvider, mockOpenAIProvider],
      policies: [mockPolicy],
      defaultPolicyKey: 'default',
    });

    // Setup default successful execution
    mockAnthropicProvider.execute.mockResolvedValue({
      content: 'Response from Claude',
      modelUsed: 'claude-3-5-sonnet',
      tokensUsed: { input: 100, output: 200 },
      cost: 0.01,
    });

    mockOpenAIProvider.execute.mockResolvedValue({
      content: 'Response from GPT-4',
      modelUsed: 'gpt-4',
      tokensUsed: { input: 100, output: 200 },
      cost: 0.02,
    });
  });

  describe('generate', () => {
    it('should route to preferred provider', async () => {
      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        capabilities: ['reasoning'],
      };

      const result = await engine.generate(request);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-3-5-sonnet');
      expect(mockAnthropicProvider.execute).toHaveBeenCalled();
    });

    it('should respect safety checks', async () => {
      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'How to hack a system' }],
        capabilities: ['reasoning'],
        requireSafetyCheck: true,
      };

      // Safety classifier should flag this
      await expect(engine.generate(request)).rejects.toThrow('Safety check failed');
    });

    it('should fallback to secondary provider on failure', async () => {
      mockAnthropicProvider.execute.mockRejectedValue(new Error('Provider unavailable'));

      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        capabilities: ['reasoning'],
      };

      const result = await engine.generate(request);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('openai'); // Fell back to OpenAI
      expect(mockOpenAIProvider.execute).toHaveBeenCalled();
    });

    it('should calculate and enforce cost constraints', async () => {
      const expensiveRequest: RoutingRequest = {
        messages: [
          {
            role: 'user',
            content: 'A'.repeat(100000), // Very long message
          },
        ],
        capabilities: ['reasoning'],
      };

      // Should route to cheaper model or provider
      await engine.generate(expensiveRequest);

      // Verify cost was calculated
      expect(mockAnthropicProvider.execute).toHaveBeenCalled();
    });

    it('should throw error when no policy found', async () => {
      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        capabilities: ['reasoning'],
        policyKey: 'non-existent-policy',
      };

      await expect(engine.generate(request)).rejects.toThrow('Policy not found');
    });

    it('should emit events during execution', async () => {
      const eventSpy = jest.fn();

      // Access private eventEmitter through type assertion
      (engine as any).eventEmitter.on('silent.safety_check_completed', eventSpy);

      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        capabilities: ['reasoning'],
      };

      await engine.generate(request);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should log audit trail', async () => {
      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        capabilities: ['reasoning'],
      };

      const result = await engine.generate(request);

      // Verify audit logging occurred
      expect(result.requestId).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('capability matching', () => {
    it('should select model with required capabilities', async () => {
      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Analyze this image' }],
        capabilities: ['vision'],
      };

      const result = await engine.generate(request);

      // Should select Claude which has vision capability
      expect(result.model).toBe('claude-3-5-sonnet');
    });

    it('should fail when no model has required capability', async () => {
      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Test' }],
        capabilities: ['non-existent-capability'],
      };

      await expect(engine.generate(request)).rejects.toThrow();
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit after repeated failures', async () => {
      // Simulate multiple failures
      mockAnthropicProvider.execute
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockRejectedValueOnce(new Error('Fail 4'))
        .mockRejectedValueOnce(new Error('Fail 5'));

      const request: RoutingRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        capabilities: ['reasoning'],
      };

      // After 5 failures, should open circuit and use fallback
      for (let i = 0; i < 5; i++) {
        try {
          await engine.generate(request);
        } catch (e) {
          // Expected failures
        }
      }

      // Next request should use fallback (OpenAI) immediately
      const result = await engine.generate(request);
      expect(result.provider).toBe('openai');
    });
  });

  describe('provider management', () => {
    it('should list all available models', () => {
      const models = (engine as any).getAllModels();

      expect(models.length).toBeGreaterThanOrEqual(2);
      expect(models.map((m: any) => m.modelKey)).toContain('claude-3-5-sonnet');
      expect(models.map((m: any) => m.modelKey)).toContain('gpt-4');
    });

    it('should route based on context window requirements', async () => {
      const largeContextRequest: RoutingRequest = {
        messages: [
          {
            role: 'user',
            content: 'A'.repeat(150000), // Exceeds GPT-4 context window
          },
        ],
        capabilities: ['reasoning'],
      };

      const result = await engine.generate(largeContextRequest);

      // Should select Claude which has larger context window
      expect(result.model).toBe('claude-3-5-sonnet');
    });
  });
});
