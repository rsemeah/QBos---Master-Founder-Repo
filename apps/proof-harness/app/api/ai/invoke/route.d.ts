import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    error: string;
}> | NextResponse<{
    ok: any;
    data: any;
    error: any;
    receipts: any;
    truthSerum: {
        valid: any;
        enginesInvoked: any;
        gatesChecked: any;
        interactions: any;
        violations: any;
    };
}>>;
//# sourceMappingURL=route.d.ts.map