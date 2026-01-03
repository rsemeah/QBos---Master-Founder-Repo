import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    error: string;
}> | NextResponse<{
    ok: any;
    data: any;
    receiptDetails: any;
}>>;
//# sourceMappingURL=route.d.ts.map