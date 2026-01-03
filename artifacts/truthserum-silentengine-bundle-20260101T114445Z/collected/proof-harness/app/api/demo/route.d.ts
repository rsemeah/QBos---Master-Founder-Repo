import { NextRequest, NextResponse } from 'next/server';
export declare function GET(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    claim: {
        timestamp: string;
        claim: string;
        proof: {
            sessionId: string;
            enginesInvoked: any;
            gatesChecked: any;
            totalReceipts: any;
            verifiedReceipts: any;
            interactions: any;
            orderingValid: boolean;
            truthSerumValid: any;
        };
        response: any;
        receipts: {
            id: any;
            actor: any;
            action: any;
            outcome: any;
            timestamp: any;
        }[];
    };
    message: string;
}> | NextResponse<{
    ok: boolean;
    error: string;
}>>;
export declare function POST(request: NextRequest): Promise<NextResponse<{
    ok: boolean;
    claim: {
        timestamp: string;
        claim: string;
        proof: {
            sessionId: string;
            enginesInvoked: any;
            gatesChecked: any;
            totalReceipts: any;
            verifiedReceipts: any;
            interactions: any;
            orderingValid: boolean;
            truthSerumValid: any;
        };
        response: any;
        receipts: {
            id: any;
            actor: any;
            action: any;
            outcome: any;
            timestamp: any;
        }[];
    };
    message: string;
}> | NextResponse<{
    ok: boolean;
    error: string;
}>>;
//# sourceMappingURL=route.d.ts.map