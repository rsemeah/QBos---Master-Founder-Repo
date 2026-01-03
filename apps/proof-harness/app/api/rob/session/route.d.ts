/**
 * GET /api/rob/session
 *
 * Retrieve Rob session details
 * - Fetches session from database by ID
 * - Returns session state and metadata
 * - Validates session ownership
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    session: {
        id: any;
        state: any;
        progress: any;
        readiness: any;
        consent_granted: any;
        template_id: any;
        created_at: any;
        updated_at: any;
    };
    messages: {
        role: any;
        content: any;
        timestamp: any;
    }[];
    receipts: {
        type: any;
        details: any;
        timestamp: any;
    }[];
}>>;
//# sourceMappingURL=route.d.ts.map