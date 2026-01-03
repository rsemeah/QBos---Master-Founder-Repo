/**
 * POST /api/webhooks/stripe
 * CRITICAL: Stripe webhook handler for payment verification
 * This is the ONLY way payment.verified receipt is emitted
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(req: NextRequest): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    received: boolean;
}>>;
//# sourceMappingURL=route.d.ts.map