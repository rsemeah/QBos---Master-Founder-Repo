/**
 * SilentEngine™ - Core Type Definitions
 *
 * Intelligent AI routing for QuietBuild OS™
 */
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface Tool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}
export interface ProviderCapabilities {
    longContext: boolean;
    toolUse: boolean;
    vision: boolean;
    streaming: boolean;
    codeGeneration: boolean;
    strongReasoning: boolean;
    highQuality: boolean;
    complexTasks: boolean;
    lowCost: boolean;
    fastLatency: boolean;
    contextWindow: number;
    maxOutputTokens: number;
}
export interface ModelMetadata {
    modelKey: string;
    displayName: string;
    providerKey: string;
    capabilities: ProviderCapabilities;
    costInputPerMTok: number;
    costOutputPerMTok: number;
    costCacheWritePerMTok?: number;
    costCacheReadPerMTok?: number;
    avgLatencyMs?: number;
    enabled: boolean;
}
export interface RoutingPolicy {
    policyKey: string;
    displayName: string;
    description: string;
    maxCostPerRequest?: number;
    maxLatencyMs?: number;
    preferredCapabilities: string[];
    requiredCapabilities: string[];
    allowFallback: boolean;
    fallbackPolicyKey?: string;
    requireSafetyCheck: boolean;
    minSafetyLevel: 'low' | 'medium' | 'high';
}
export interface OrgPolicy {
    orgId: string;
    maxCostPerHour?: number;
    maxCostPerDay?: number;
    maxCostPerMonth?: number;
    maxRequestsPerMinute?: number;
    maxRequestsPerHour?: number;
    maxConcurrentRequests?: number;
    allowedProviders: string[];
    blockedModels: string[];
    defaultPolicyKey: string;
    enableStreaming: boolean;
    enableTools: boolean;
    enableCaching: boolean;
}
export interface RoutingRequest {
    requestId?: string;
    orgId?: string;
    userId?: string;
    messages: Message[];
    systemPrompt?: string;
    requiredCapabilities?: string[];
    preferredCapabilities?: string[];
    maxCost?: number;
    maxLatency?: number;
    allowTools?: boolean;
    tools?: Tool[];
    policyKey?: string;
    requireSafetyCheck?: boolean;
}
export interface RoutingDecision {
    provider: string;
    model: string;
    policyUsed: string;
    reasonCodes: string[];
    capabilityMatchScore: number;
    alternativesEvaluated: {
        provider: string;
        model: string;
        score: number;
        rejectedReason: string;
    }[];
    constraints: {
        maxCost?: number;
        maxLatency?: number;
        requiredCapabilities: string[];
    };
    fallbackUsed: boolean;
    fallbackFrom?: string;
    safetyCheckApplied: boolean;
    safetyFlags: string[];
    routingLatencyMs: number;
    timestamp: Date;
}
export interface ProviderRequest {
    model: string;
    messages: Message[];
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    tools?: Tool[];
    stream?: boolean;
}
export interface ProviderResponse {
    text: string;
    tokensInput: number;
    tokensOutput: number;
    tokensCacheWrite?: number;
    tokensCacheRead?: number;
    finishReason: string;
    latencyMs: number;
}
export interface ProviderHealthStatus {
    available: boolean;
    latencyMs?: number;
    errorMessage?: string;
}
export interface ProviderConfig {
    providerKey: string;
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
export interface ProviderInterface {
    readonly providerKey: string;
    readonly displayName: string;
    configure(config: ProviderConfig): void;
    generate(request: ProviderRequest): Promise<ProviderResponse>;
    generateStream(request: ProviderRequest): AsyncIterable<{
        text: string;
        isDone: boolean;
    }>;
    healthCheck(): Promise<ProviderHealthStatus>;
    getSupportedModels(): ModelMetadata[];
}
export interface ExecutionResult {
    requestId: string;
    provider: string;
    model: string;
    response: ProviderResponse;
    actualCost: number;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    totalLatencyMs: number;
    timeToFirstTokenMs?: number;
}
//# sourceMappingURL=types.d.ts.map