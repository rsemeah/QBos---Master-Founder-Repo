/**
 * POST /api/jobs/process
 * Background job processor (called by cron or manual trigger)
 * Replaces unreliable setTimeout() calls
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(req: NextRequest): Promise<NextResponse<{
    processed: number;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map