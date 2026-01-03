import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    tracked: boolean;
    warning: string;
}> | NextResponse<{
    ok: boolean;
    error: string;
}> | NextResponse<{
    ok: boolean;
    tracked: boolean;
    data: {
        validation: any;
        qualityScore: any;
        meetsStandards: any;
    };
    message: string;
}>>;
//# sourceMappingURL=route.d.ts.map