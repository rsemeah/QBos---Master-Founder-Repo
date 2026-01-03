import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    error: string;
}> | NextResponse<{
    ok: boolean;
    data: {
        features: string[];
        plan?: import("@qbos/paywall-engine-core").PricingPlan;
    };
    message: string;
}>>;
//# sourceMappingURL=route.d.ts.map