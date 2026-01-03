import { BaseProvider, GenerationRequest, GenerationResponse } from './base-provider';
import { ModelCapability } from '../types';
export interface OpenAIConfig {
    apiKey: string;
    baseURL?: string;
    organization?: string;
}
export declare class OpenAIProvider extends BaseProvider {
    private client;
    constructor(config: OpenAIConfig);
    generate(request: GenerationRequest): Promise<GenerationResponse>;
    getAvailableModels(): string[];
    getModelCapabilities(model: string): ModelCapability[];
    getInputCost(model: string, tokens: number): number;
    getOutputCost(model: string, tokens: number): number;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=openai-provider.d.ts.map