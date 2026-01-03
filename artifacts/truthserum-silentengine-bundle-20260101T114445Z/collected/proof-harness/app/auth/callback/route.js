"use strict";
/**
 * Auth Callback - Handles Supabase auth redirects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
const headers_1 = require("next/headers");
const server_1 = require("next/server");
async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    if (code) {
        const supabase = (0, auth_helpers_nextjs_1.createRouteHandlerClient)({ cookies: headers_1.cookies });
        await supabase.auth.exchangeCodeForSession(code);
    }
    return server_1.NextResponse.redirect(new URL('/dashboard', request.url));
}
//# sourceMappingURL=route.js.map