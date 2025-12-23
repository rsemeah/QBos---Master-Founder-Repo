/**
 * SilentEngine™ - Core Package Exports
 *
 * Intelligent AI routing for QuietBuild OS™
 */

// Main engine
export { SilentEngine, SilentEngineConfig } from './silent-engine';

// Types
export * from './types';

// Providers
export { BaseProvider } from './providers/base-provider';
export { MockProvider } from './providers/mock-provider';

// Routing
export { RoutingEngine } from './routing/routing-engine';
export { CapabilityMatcher, CapabilityMatchResult } from './routing/capability-matcher';
export { ConstraintEvaluator, ConstraintEvaluation } from './routing/constraint-evaluator';
export { CostCalculator } from './routing/cost-calculator';

// Fallback
export { CircuitBreaker, CircuitState, CircuitBreakerConfig } from './fallback/circuit-breaker';
export { FallbackOrchestrator, FallbackCandidate } from './fallback/fallback-orchestrator';

// Safety
export { SafetyClassifier, SafetyCheckResult } from './safety/safety-classifier';
export { PIIDetector, PIIDetectionResult } from './safety/pii-detector';

// Observability
export { EventEmitter, SilentEngineEvent, EventHandler } from './observability/event-emitter';
export { AuditLogger, AuditLog } from './observability/audit-logger';
