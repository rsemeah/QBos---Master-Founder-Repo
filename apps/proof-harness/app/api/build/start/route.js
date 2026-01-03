"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
async function POST(request) {
    const supabase = (0, auth_helpers_nextjs_1.createRouteHandlerClient)({ cookies: headers_1.cookies });
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { idea } = await request.json();
    if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
        return server_1.NextResponse.json({ error: 'Idea must be at least 10 characters' }, { status: 400 });
    }
    const { data: session, error: sessionError } = await supabase
        .from('build_sessions')
        .insert({
        user_id: user.id,
        idea_description: idea.trim(),
        current_state: 'IDEA_CAPTURE',
        readiness_tier: 'DRAFT',
    })
        .select()
        .single();
    if (sessionError || !session) {
        return server_1.NextResponse.json({ error: sessionError?.message ?? 'Failed to create session' }, { status: 500 });
    }
    const { error: receiptError } = await supabase.from('build_receipts').insert({
        session_id: session.id,
        type: 'session.created',
        details: {
            userId: user.id,
            idea: idea.trim(),
            state: session.current_state,
        },
    });
    if (receiptError) {
        return server_1.NextResponse.json({ error: receiptError.message }, { status: 500 });
    }
    return server_1.NextResponse.json({ session });
}
//# sourceMappingURL=route.js.map