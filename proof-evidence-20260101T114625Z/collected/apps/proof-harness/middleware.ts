/**
 * Middleware - Auth protection for protected routes
 * Uses Supabase Auth to validate sessions
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/build'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Guard against missing Supabase envs in local/dev environments.
  // `createMiddlewareClient` will throw if NEXT_PUBLIC_SUPABASE_URL or
  // NEXT_PUBLIC_SUPABASE_ANON_KEY are not present — handle that gracefully
  // so the dev server doesn't return 500 for protected routes when running
  // without Supabase configured.
  let data: { session: any } | null = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createMiddlewareClient({ req: request, res: response });
      const sessionRes = await supabase.auth.getSession();
      data = sessionRes.data || null;
    } catch (err) {
      // If Supabase helper fails for any reason, log and continue in mock mode.
      // Do not block requests — fallback to allowing the request in dev.
      // eslint-disable-next-line no-console
      console.warn('Supabase middleware client failed, proceeding without auth:', err);
      data = null;
    }
  } else {
    // No Supabase configured; operate in mock/dev mode and skip auth checks.
    data = null;
  }
  const isProtected = PROTECTED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !(data && data.session)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/build/:path*'],
};
