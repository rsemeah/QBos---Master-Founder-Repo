import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    receipts: any[];
    count: number;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map