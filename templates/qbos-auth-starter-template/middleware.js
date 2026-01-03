"use strict";
/**
 * Middleware - Route Protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
const server_1 = require("next/server");
async function middleware(req) {
    const res = server_1.NextResponse.next();
    const supabase = (0, auth_helpers_nextjs_1.createMiddlewareClient)({ req, res });
    const { data: { session }, } = await supabase.auth.getSession();
    // Protected routes require authentication
    if (!session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return server_1.NextResponse.redirect(redirectUrl);
    }
    return res;
}
exports.config = {
    matcher: ['/dashboard/:path*'],
};
//# sourceMappingURL=middleware.js.map