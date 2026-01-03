/**
 * Session API - Create and manage build sessions
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    sessionId: string;
    userId: any;
    templateId: any;
    appName: any;
    state: string;
    created: string;
}> | NextResponse<{
    error: string;
}>>;
export declare function GET(request: NextRequest): Promise<NextResponse<any>>;
//# sourceMappingURL=route.d.ts.map