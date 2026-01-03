/**
 * Chat API - TruthSerum-first chat endpoint
 * Pipeline: auth → billing → persist user message → evaluate intent → AI generate → sanitize → persist
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    message: string;
    state: any;
    missingProofs: any;
    nextActions: any;
}> | NextResponse<{
    message: any;
    state: any;
    missingProofs: any;
    nextActions: any;
    timestamp: string;
}>>;
//# sourceMappingURL=route.d.ts.map