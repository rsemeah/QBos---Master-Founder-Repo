export type ObservabilityEventType = "app.built" | "deploy.attempted" | "verify.passed" | "verify.failed";
export interface ObservabilityEvent {
    type: ObservabilityEventType;
    timestamp: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}
export declare function logObservabilityEvent(event: ObservabilityEvent, filePath?: string): void;
//# sourceMappingURL=observability.d.ts.map