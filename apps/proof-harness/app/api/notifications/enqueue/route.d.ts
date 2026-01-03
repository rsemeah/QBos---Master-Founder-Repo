import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    error: string;
}> | NextResponse<{
    ok: boolean;
    data: {
        queueSize: number;
    };
    message: string;
}>>;
//# sourceMappingURL=route.d.ts.map