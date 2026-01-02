import OpenAI from 'openai';
import { BaseProvider, GenerationRequest, GenerationResponse } from './base-provider';
import { ModelCapability } from '../types';

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI;
  
  constructor(config: OpenAIConfig) {
    super('openai');
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
  }
  
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages.map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
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
      'gpt-4-turbo-2024-04-09',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-4',
      'gpt-3.5-turbo',
    ];
  }
  
  getModelCapabilities(model: string): ModelCapability[] {
    const baseCapabilities: ModelCapability[] = [
      'tool_use',
      'streaming',
    ];
    
    if (model.includes('gpt-4')) {
      const gpt4Capabilities: ModelCapability[] = [
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
  
  getInputCost(model: string, tokens: number): number {
    const costsPer1M: Record<string, number> = {
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
  
  getOutputCost(model: string, tokens: number): number {
    const costsPer1M: Record<string, number> = {
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
  
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
