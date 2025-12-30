/**
 * GET /api/build/sessions
 * Get all build sessions for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
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

      return NextResponse.json({
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

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
    });

  } catch (error: any) {
    console.error('[build/sessions]', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}
