/**
 * MockProvider - Minimal Provider for Testing
 *
 * Returns canned responses without external API calls.
 * Used to prove SilentEngine integration without requiring API keys.
 */
import type { ProviderInterface, ProviderConfig, ProviderRequest, ProviderResponse, ProviderHealthStatus, ModelMetadata } from '../types';
export declare class MockProvider implements ProviderInterface {
    readonly providerKey = "mock";
    readonly displayName = "Mock Provider";
    private configured;
    configure(config: ProviderConfig): void;
    generate(request: ProviderRequest): Promise<ProviderResponse>;
    generateStream(request: ProviderRequest): AsyncIterable<{
        text: string;
        isDone: boolean;
    }>;
    healthCheck(): Promise<ProviderHealthStatus>;
    getSupportedModels(): ModelMetadata[];
}
//# sourceMappingURL=mock-provider.d.ts.map