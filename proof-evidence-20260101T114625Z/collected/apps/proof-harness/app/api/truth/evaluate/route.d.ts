/**
 * TruthSerum evaluation API
 * Returns verdict for a given intent
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    evaluation: any;
    receiptCount: any;
    timestamp: string;
}>>;
//# sourceMappingURL=route.d.ts.map