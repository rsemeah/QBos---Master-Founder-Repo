/**
 * BuildSessionManager - Manages build sessions with Supabase
 * Used by API routes to create and manage build sessions
 */
export declare class BuildSession {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Create a new build session
     */
    create(userId: string, ideaDescription: string): Promise<any>;
    /**
     * Match a template based on the idea description
     */
    matchTemplate(sessionId: string): Promise<{
        template: any;
        confidence: string;
    }>;
}
//# sourceMappingURL=BuildSessionManager.d.ts.map