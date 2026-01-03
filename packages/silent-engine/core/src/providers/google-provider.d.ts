import { BaseProvider, GenerationRequest, GenerationResponse } from './base-provider';
import { ModelCapability } from '../types';
export interface GoogleConfig {
    apiKey: string;
}
export declare class GoogleProvider extends BaseProvider {
    private client;
    constructor(config: GoogleConfig);
    generate(request: GenerationRequest): Promise<GenerationResponse>;
    private mapFinishReason;
    getAvailableModels(): string[];
    getModelCapabilities(model: string): ModelCapability[];
    getInputCost(model: string, tokens: number): number;
    getOutputCost(model: string, tokens: number): number;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=google-provider.d.ts.map