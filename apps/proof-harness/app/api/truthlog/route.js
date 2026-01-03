"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const supabase_js_1 = require("@supabase/supabase-js");
exports.dynamic = 'force-dynamic';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');
        const engines = searchParams.get('engines')?.split(',') || [];
        const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        let query = supabase
            .from('rob_receipts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);
        if (sessionId && sessionId !== 'all') {
            query = query.eq('session_id', sessionId);
        }
        if (engines.length > 0) {
            // Filter by receipt types that match engine prefixes
            const typeFilters = engines.map(engine => `${engine}.`);
            query = query.or(typeFilters.map(prefix => `type.ilike.${prefix}%`).join(','));
        }
        const { data, error } = await query;
        if (error) {
            console.error('Supabase error:', error);
            return server_1.NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
        }
        return server_1.NextResponse.json({
            success: true,
            receipts: data || [],
            count: data?.length || 0,
        });
    }
    catch (error) {
        console.error('TruthLog API error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map