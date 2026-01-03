"use strict";
/**
 * GET /api/build/sessions
 * Get all build sessions for authenticated user
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
const headers_1 = require("next/headers");
exports.dynamic = 'force-dynamic';
async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');
        // Get authenticated user
        const supabase = (0, auth_helpers_nextjs_1.createRouteHandlerClient)({ cookies: headers_1.cookies });
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return server_1.NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 });
        }
        if (sessionId) {
            const { data: session, error } = await supabase
                .from('build_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('id', sessionId)
                .single();
            if (error) {
                throw error;
            }
            return server_1.NextResponse.json({
                success: true,
                session,
            });
        }
        // Get user's sessions
        const { data: sessions, error } = await supabase
            .from('build_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        return server_1.NextResponse.json({
            success: true,
            sessions: sessions || [],
        });
    }
    catch (error) {
        console.error('[build/sessions]', error);
        return server_1.NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map