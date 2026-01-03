/**
 * Health Check Endpoint
 * Used by QuietBuild OS to verify deployment
 */
import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    status: string;
    timestamp: string;
    service: string;
}>>;
//# sourceMappingURL=route.d.ts.map