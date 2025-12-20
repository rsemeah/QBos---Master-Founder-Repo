import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider, GenerationRequest, GenerationResponse } from './base-provider';
import { ModelCapability } from '../types';

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
}

export class AnthropicProvider extends BaseProvider {
  private client: Anthropic;
  
  constructor(config: AnthropicConfig) {
    super('anthropic');
    
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      maxRetries: config.maxRetries ?? 2,
    });
  }
  
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      // Extract system prompt if present
      const systemPrompt = request.messages.find(m => m.role === 'system')?.content;
      const messages = request.messages.filter(m => m.role !== 'system');
      
      // Call Anthropic API
      const response = await this.client.messages.create({
        model: request.model,
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        system: systemPrompt,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 1.0,
        stream: false,
      });
      
      const latency = Date.now() - startTime;
      
      // Calculate cost (prices per 1M tokens)
      const inputCost = this.getInputCost(request.model, response.usage.input_tokens);
      const outputCost = this.getOutputCost(request.model, response.usage.output_tokens);
      const totalCost = inputCost + outputCost;
      
      return {
        text: response.content[0].type === 'text' ? response.content[0].text : '',
        finishReason: response.stop_reason || 'stop',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        cost: totalCost,
        latency,
        model: response.model,
        provider: 'anthropic',
      };
    } catch (error: any) {
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
  
  getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }
  
  getModelCapabilities(model: string): ModelCapability[] {
    const baseCapabilities: ModelCapability[] = [
      'long_context',
      'tool_use',
      'streaming',
    ];
    
    if (model.includes('opus')) {
      return [...baseCapabilities, 'vision', 'strong_reasoning'];
    }
    
    if (model.includes('sonnet')) {
      return [...baseCapabilities, 'vision', 'code_generation', 'strong_reasoning'];
    }
    
    if (model.includes('haiku')) {
      return [...baseCapabilities, 'vision', 'low_cost', 'fast_latency'];
    }
    
    return baseCapabilities;
  }
  
  getInputCost(model: string, tokens: number): number {
    const costsPer1M: Record<string, number> = {
      'claude-3-5-sonnet-20241022': 3.00,
      'claude-3-opus-20240229': 15.00,
      'claude-3-sonnet-20240229': 3.00,
      'claude-3-haiku-20240307': 0.25,
    };
    
    const costPer1M = costsPer1M[model] || 3.00;
    return (tokens / 1_000_000) * costPer1M;
  }
  
  getOutputCost(model: string, tokens: number): number {
    const costsPer1M: Record<string, number> = {
      'claude-3-5-sonnet-20241022': 15.00,
      'claude-3-opus-20240229': 75.00,
      'claude-3-sonnet-20240229': 15.00,
      'claude-3-haiku-20240307': 1.25,
    };
    
    const costPer1M = costsPer1M[model] || 15.00;
    return (tokens / 1_000_000) * costPer1M;
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check - try to get model info
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
