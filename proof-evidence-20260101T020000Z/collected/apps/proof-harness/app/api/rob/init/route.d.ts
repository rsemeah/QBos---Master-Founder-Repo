/**
 * POST /api/rob/init
 *
 * Initialize a minimal Rob session (vertical slice)
 * - Creates session in database
 * - Emits session.created receipt
 * - Returns session with initial state
 *
 * No AI. No templates. Just state management + receipts.
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    session: {
        id: any;
        state: any;
        progress: any;
        readiness: any;
        consent_granted: any;
    };
    messages: {
        role: any;
        content: any;
        timestamp: any;
    }[] | undefined;
}>>;
//# sourceMappingURL=route.d.ts.map