import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    error: string;
}> | NextResponse<{
    ok: boolean;
    data: import("@qbos/config-engine-core").FeatureFlagEvaluation;
    message: string;
}>>;
//# sourceMappingURL=route.d.ts.map