/**
 * GET /api/rob/session
 *
 * Retrieve Rob session details
 * - Fetches session from database by ID
 * - Returns session state and metadata
 * - Validates session ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id query parameter required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          warning: 'Running in mock mode - sessions cannot be retrieved'
        },
        { status: 503 }
      );
    }

    // Get user (mock for now, real auth later)
    const userId = request.headers.get('x-user-id') || 'mock-user-123';

    // Real Supabase path
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('rob_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found or access denied' },
          { status: 404 }
        );
      }
      throw new Error(`Database error: ${sessionError.message}`);
    }

    // Fetch recent messages
    const { data: messages } = await supabase
      .from('rob_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    // Fetch receipts
    const { data: receipts } = await supabase
      .from('rob_receipts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      ok: true,
      session: {
        id: session.id,
        state: session.current_state,
        progress: session.progress_percent,
        readiness: session.readiness_tier,
        consent_granted: session.app_config?.consent_granted || false,
        template_id: session.template_id,
        created_at: session.created_at,
        updated_at: session.updated_at,
      },
      messages: messages?.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
      })) || [],
      receipts: receipts?.map((r) => ({
        type: r.type,
        details: r.details,
        timestamp: r.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('Failed to retrieve Rob session:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
