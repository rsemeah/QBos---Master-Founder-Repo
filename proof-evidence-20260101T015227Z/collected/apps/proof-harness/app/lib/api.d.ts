/**
 * API Client - Type-safe API wrapper functions
 */
export interface BuildSession {
    id: string;
    user_id: string;
    idea_description: string;
    current_state: string;
    readiness_tier: string;
    template_id?: string;
    config?: Record<string, any>;
    github_repo_url?: string;
    vercel_deployment_url?: string;
    created_at: string;
    updated_at: string;
}
export interface StartBuildResponse {
    success: boolean;
    session: BuildSession;
    match: {
        template: any;
        confidence: string;
    };
}
export interface PaymentIntentResponse {
    success: boolean;
    clientSecret: string;
    paymentIntentId: string;
}
/**
 * Start a new build session
 */
export declare function startBuild(ideaDescription: string): Promise<StartBuildResponse>;
/**
 * Get build session by ID
 */
export declare function getBuildSession(sessionId: string): Promise<BuildSession>;
/**
 * Create payment intent
 */
export declare function createPaymentIntent(sessionId: string): Promise<PaymentIntentResponse>;
/**
 * Get user's build sessions
 */
export declare function getUserSessions(): Promise<BuildSession[]>;
//# sourceMappingURL=api.d.ts.map