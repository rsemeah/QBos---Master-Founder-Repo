/**
 * Billing Status API - Returns billing state from receipts
 * NO optimistic claims - only what receipts prove
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    state: TruthState;
    billingActive: boolean;
    capExceeded: boolean;
    missingProofs: string[];
    receipts: any;
    timestamp: string;
}>>;
//# sourceMappingURL=route.d.ts.map