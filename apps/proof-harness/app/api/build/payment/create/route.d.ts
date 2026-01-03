import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    clientSecret: string | null;
    paymentIntentId: string;
    amount: number;
    currency: string;
}>>;
//# sourceMappingURL=route.d.ts.map