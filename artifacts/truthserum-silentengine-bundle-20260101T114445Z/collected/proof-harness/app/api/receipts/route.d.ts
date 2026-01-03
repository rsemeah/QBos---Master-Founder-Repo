/**
 * Receipts API - Read receipts for a session
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function GET(request: NextRequest): Promise<NextResponse<{
    receipts: any;
    count: any;
    sessionId: string | undefined;
}> | NextResponse<{
    error: string;
}>>;
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    receipt: any;
    status: string;
}>>;
//# sourceMappingURL=route.d.ts.map