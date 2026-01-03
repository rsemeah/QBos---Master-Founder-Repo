import { BaseProvider, GenerationRequest, GenerationResponse } from './base-provider';
import { ModelCapability } from '../types';
export interface AnthropicConfig {
    apiKey: string;
    baseURL?: string;
    maxRetries?: number;
}
export declare class AnthropicProvider extends BaseProvider {
    private client;
    constructor(config: AnthropicConfig);
    generate(request: GenerationRequest): Promise<GenerationResponse>;
    getAvailableModels(): string[];
    getModelCapabilities(model: string): ModelCapability[];
    getInputCost(model: string, tokens: number): number;
    getOutputCost(model: string, tokens: number): number;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=anthropic-provider.d.ts.map