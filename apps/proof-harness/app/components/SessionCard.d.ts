/**
 * SessionCard - Reusable session display card
 * Used in dashboard to show build sessions
 */
interface SessionCardProps {
    session: {
        id: string;
        idea_description: string;
        current_state: string;
        readiness_tier: string;
        created_at: string;
        template_id?: string;
        config?: Record<string, any>;
    };
}
export declare function SessionCard({ session }: SessionCardProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SessionCard.d.ts.map