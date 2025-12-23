/**
 * MockProvider - Minimal Provider for Testing
 * 
 * Returns canned responses without external API calls.
 * Used to prove SilentEngine integration without requiring API keys.
 */

import type {
  ProviderInterface,
  ProviderConfig,
  ProviderRequest,
  ProviderResponse,
  ProviderHealthStatus,
  ModelMetadata,
} from '../types';

export class MockProvider implements ProviderInterface {
  readonly providerKey = 'mock';
  readonly displayName = 'Mock Provider';

  private configured = false;

  configure(config: ProviderConfig): void {
    this.configured = true;
  }

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
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

  async *generateStream(
    request: ProviderRequest
  ): AsyncIterable<{ text: string; isDone: boolean }> {
    const response = await this.generate(request);
    yield { text: response.text, isDone: true };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return {
      available: this.configured,
      latencyMs: 10,
      errorMessage: this.configured ? undefined : 'Not configured',
    };
  }

  getSupportedModels(): ModelMetadata[] {
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
