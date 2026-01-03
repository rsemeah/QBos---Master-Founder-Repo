/**
 * SilentEngine™ - Base Provider
 *
 * Abstract base class for AI provider implementations
 */
import { ProviderInterface, ProviderConfig, ProviderRequest, ProviderResponse, ProviderHealthStatus, ModelMetadata } from '../types';
export declare abstract class BaseProvider implements ProviderInterface {
    abstract readonly providerKey: string;
    abstract readonly displayName: string;
    protected config?: ProviderConfig;
    protected models: ModelMetadata[];
    /**
     * Configure provider with API keys and settings
     */
    configure(config: ProviderConfig): void;
    /**
     * Generate response (non-streaming)
     */
    abstract generate(request: ProviderRequest): Promise<ProviderResponse>;
    /**
     * Generate response (streaming)
     */
    abstract generateStream(request: ProviderRequest): AsyncIterable<{
        text: string;
        isDone: boolean;
    }>;
    /**
     * Health check
     */
    abstract healthCheck(): Promise<ProviderHealthStatus>;
    /**
     * Get supported models
     */
    getSupportedModels(): ModelMetadata[];
    /**
     * Ensure provider is configured
     */
    protected ensureConfigured(): void;
}
//# sourceMappingURL=base-provider.d.ts.map