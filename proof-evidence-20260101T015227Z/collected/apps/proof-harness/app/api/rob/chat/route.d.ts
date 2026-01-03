/**
 * POST /api/rob/chat
 *
 * Rob's chat endpoint with full constitutional pipeline:
 * 1. Auth check
 * 2. Billing cap enforcement
 * 3. Persist user message
 * 4. State transition (LISTENING)
 * 5. SilentEngine invocation
 * 6. TruthSerum validation
 * 7. Persist assistant message
 * 8. Return response
 *
 * Emits receipts: user_input_received, ai_invoked, message_validated
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    message: any;
    metadata: {
        truthserum: {
            violations: string[];
            rewritten: boolean;
        };
        session: {
            state: string;
            progress: any;
            readiness: any;
        };
    };
}>>;
//# sourceMappingURL=route.d.ts.map