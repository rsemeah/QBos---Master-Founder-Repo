/**
 * Middleware - Auth protection for protected routes
 * Uses Supabase Auth to validate sessions
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export declare function middleware(request: NextRequest): Promise<NextResponse<unknown>>;
export declare const config: {
    matcher: string[];
};
//# sourceMappingURL=middleware.d.ts.map