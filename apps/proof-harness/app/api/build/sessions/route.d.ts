/**
 * GET /api/build/sessions
 * Get all build sessions for authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    session: any;
}> | NextResponse<{
    success: boolean;
    sessions: any[];
}>>;
//# sourceMappingURL=route.d.ts.map