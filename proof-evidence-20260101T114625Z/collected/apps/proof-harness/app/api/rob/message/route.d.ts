/**
 * POST /api/rob/message
 *
 * Handle user messages in Rob vertical slice:
 * 1. Persist user message
 * 2. Check CharterEngine consent gate
 * 3. Generate deterministic response (no AI)
 * 4. Emit receipts
 * 5. Transition state
 *
 * Constitutional guarantees:
 * - Consent enforcement (CharterEngine)
 * - Receipt persistence (Memory)
 * - State transitions (Truth)
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    response: string;
    system_message: string;
    session: {
        id: any;
        state: any;
        progress: any;
        readiness: any;
        consent_granted: boolean;
    };
}> | NextResponse<{
    ok: boolean;
    response: string;
    session: {
        id: any;
        state: string;
        progress: any;
        readiness: any;
        consent_granted: boolean;
    };
}>>;
//# sourceMappingURL=route.d.ts.map