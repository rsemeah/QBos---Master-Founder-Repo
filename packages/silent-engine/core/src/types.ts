/**
 * SilentEngine™ - Core Type Definitions
 *
 * Intelligent AI routing for QuietBuild OS™
 */

// ============================================================================
// MESSAGE & CONTENT
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

// ============================================================================
// PROVIDER CAPABILITIES
// ============================================================================

export interface ProviderCapabilities {
  longContext: boolean;          // 100K+ tokens
  toolUse: boolean;               // Function calling
  vision: boolean;                // Image understanding
  streaming: boolean;             // Streaming responses
  codeGeneration: boolean;        // Code-focused models
  strongReasoning: boolean;       // Complex reasoning (e.g., o1, Claude Opus)
  highQuality: boolean;           // Top-tier quality
  complexTasks: boolean;          // Multi-step tasks
  lowCost: boolean;               // Cost-optimized
  fastLatency: boolean;           // Low latency
  contextWindow: number;          // Max context tokens
  maxOutputTokens: number;        // Max generation tokens
}

// ============================================================================
// MODEL METADATA
// ============================================================================

export interface ModelMetadata {
  modelKey: string;               // e.g., 'claude-3-5-sonnet-20241022'
  displayName: string;            // e.g., 'Claude 3.5 Sonnet'
  providerKey: string;            // e.g., 'anthropic'
  capabilities: ProviderCapabilities;
  costInputPerMTok: number;       // Cost per million input tokens
  costOutputPerMTok: number;      // Cost per million output tokens
  costCacheWritePerMTok?: number; // Prompt caching write cost
  costCacheReadPerMTok?: number;  // Prompt caching read cost
  avgLatencyMs?: number;          // Average latency
  enabled: boolean;               // Is model available for routing?
}

// ============================================================================
// ROUTING POLICY
// ============================================================================

export interface RoutingPolicy {
  policyKey: string;              // Unique identifier
  displayName: string;            // Human-readable name
  description: string;            // Policy description
  maxCostPerRequest?: number;     // Max cost constraint (USD)
  maxLatencyMs?: number;          // Max latency constraint (ms)
  preferredCapabilities: string[]; // Preferred capabilities (soft requirement)
  requiredCapabilities: string[]; // Required capabilities (hard requirement)
  allowFallback: boolean;         // Allow fallback to other providers
  fallbackPolicyKey?: string;     // Fallback policy if primary fails
  requireSafetyCheck: boolean;    // Enforce safety checks
  minSafetyLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// ORG POLICY (TENANT OVERRIDES)
// ============================================================================

export interface OrgPolicy {
  orgId: string;
  maxCostPerHour?: number;        // Spend limits
  maxCostPerDay?: number;
  maxCostPerMonth?: number;
  maxRequestsPerMinute?: number;  // Rate limits
  maxRequestsPerHour?: number;
  maxConcurrentRequests?: number;
  allowedProviders: string[];     // Provider whitelist
  blockedModels: string[];        // Model blacklist
  defaultPolicyKey: string;       // Default routing policy
  enableStreaming: boolean;       // Allow streaming
  enableTools: boolean;           // Allow tool use
  enableCaching: boolean;         // Allow prompt caching
}

// ============================================================================
// ROUTING REQUEST
// ============================================================================

export interface RoutingRequest {
  requestId?: string;             // Optional request ID
  orgId?: string;                 // Organization ID (for multi-tenant)
  userId?: string;                // User ID (for tracking)
  messages: Message[];            // Conversation messages
  systemPrompt?: string;          // System prompt
  requiredCapabilities?: string[]; // Hard requirements
  preferredCapabilities?: string[]; // Soft preferences
  maxCost?: number;               // Cost constraint
  maxLatency?: number;            // Latency constraint
  allowTools?: boolean;           // Allow tool use
  tools?: Tool[];                 // Tool definitions
  policyKey?: string;             // Override default policy
  requireSafetyCheck?: boolean;   // Override safety check
}

// ============================================================================
// ROUTING DECISION
// ============================================================================

export interface RoutingDecision {
  provider: string;               // Chosen provider
  model: string;                  // Chosen model
  policyUsed: string;             // Policy applied
  reasonCodes: string[];          // Why this model was chosen
  capabilityMatchScore: number;   // 0.0 to 1.0
  alternativesEvaluated: {        // Models considered but rejected
    provider: string;
    model: string;
    score: number;
    rejectedReason: string;
  }[];
  constraints: {                  // Constraints applied
    maxCost?: number;
    maxLatency?: number;
    requiredCapabilities: string[];
  };
  fallbackUsed: boolean;          // Did we fall back?
  fallbackFrom?: string;          // Original model (if fallback)
  safetyCheckApplied: boolean;    // Was safety check performed?
  safetyFlags: string[];          // Safety flags raised
  routingLatencyMs: number;       // Time spent routing
  timestamp: Date;                // When routing occurred
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface ProviderRequest {
  model: string;                  // Model key
  messages: Message[];            // Messages
  systemPrompt?: string;          // System prompt
  maxTokens?: number;             // Max output tokens
  temperature?: number;           // Sampling temperature
  tools?: Tool[];                 // Tool definitions
  stream?: boolean;               // Enable streaming
}

export interface ProviderResponse {
  text: string;                   // Generated text
  tokensInput: number;            // Input tokens used
  tokensOutput: number;           // Output tokens generated
  tokensCacheWrite?: number;      // Cache write tokens
  tokensCacheRead?: number;       // Cache read tokens
  finishReason: string;           // Why generation stopped
  latencyMs: number;              // Time to complete
}

export interface ProviderHealthStatus {
  available: boolean;             // Is provider available?
  latencyMs?: number;             // Health check latency
  errorMessage?: string;          // Error if unavailable
}

export interface ProviderConfig {
  providerKey: string;            // Provider identifier
  apiKey: string;                 // API key
  baseUrl?: string;               // Custom base URL
  timeout?: number;               // Request timeout
}

export interface ProviderInterface {
  readonly providerKey: string;   // Unique provider identifier
  readonly displayName: string;   // Human-readable name

  configure(config: ProviderConfig): void;
  generate(request: ProviderRequest): Promise<ProviderResponse>;
  generateStream(request: ProviderRequest): AsyncIterable<{ text: string; isDone: boolean }>;
  healthCheck(): Promise<ProviderHealthStatus>;
  getSupportedModels(): ModelMetadata[];
}

// ============================================================================
// EXECUTION RESULT
// ============================================================================

export interface ExecutionResult {
  requestId: string;              // Request ID
  provider: string;               // Provider used
  model: string;                  // Model used
  response: ProviderResponse;     // Provider response
  actualCost: number;             // Actual cost (USD)
  success: boolean;               // Did request succeed?
  errorCode?: string;             // Error code if failed
  errorMessage?: string;          // Error message if failed
  totalLatencyMs: number;         // Total latency (routing + execution)
  timeToFirstTokenMs?: number;    // Time to first token (streaming)
}
