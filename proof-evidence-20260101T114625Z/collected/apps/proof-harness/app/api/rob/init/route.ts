/**
 * POST /api/rob/init
 * 
 * Initialize a minimal Rob session (vertical slice)
 * - Creates session in database
 * - Emits session.created receipt
 * - Returns session with initial state
 * 
 * No AI. No templates. Just state management + receipts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Get user (mock for now, real auth later)
    const userId = request.headers.get('x-user-id') || 'mock-user-123';

    const body = await request.json();
    const { template_id } = body;

    if (!template_id) {
      return NextResponse.json(
        { error: 'template_id required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      // Fallback: In-memory mock session
      const mockSession = {
        id: `mock-${Date.now()}`,
        user_id: userId,
        template_id,
        state: 'INIT',
        progress: 0,
        readiness: 'draft',
        consent_granted: false,
        created_at: new Date().toISOString(),
      };

      return NextResponse.json({
        ok: true,
        session: mockSession,
        messages: [
          {
            role: 'system',
            content:
              '⚠️ Running in mock mode (Supabase not configured). Receipts will not persist.',
            timestamp: new Date().toISOString(),
          },
          {
            role: 'assistant',
            content:
              "Hello! I'm Rob the QuietBuilder. Before we begin, I need your consent to proceed. Please type 'I consent' to continue.",
            timestamp: new Date().toISOString(),
          },
        ],
        warning: 'Running in mock mode',
      });
    }

    // Real Supabase path
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('rob_sessions')
      .insert({
        user_id: userId,
        template_id,
        current_state: 'INIT',
        progress_percent: 0,
        readiness_tier: 'draft',
        app_config: { consent_granted: false },
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Database error: ${sessionError.message}`);
    }

    // Emit session.created receipt
    const { error: receiptError } = await supabase.from('rob_receipts').insert({
      session_id: session.id,
      type: 'session.created',
      details: {
        template_id,
        user_id: userId,
        initial_state: 'INIT',
      },
    });

    if (receiptError) {
      console.error('Failed to emit receipt:', receiptError);
    }

    // Add initial messages
    const initialMessages = [
      {
        session_id: session.id,
        role: 'system',
        content: '✅ Session initialized. Receipts are persisting to database.',
      },
      {
        session_id: session.id,
        role: 'assistant',
        content:
          "Hello! I'm Rob the QuietBuilder. Before we begin, I need your consent to proceed. Please type 'I consent' to continue.",
      },
    ];

    const { data: messages } = await supabase
      .from('rob_messages')
      .insert(initialMessages)
      .select();

    return NextResponse.json({
      ok: true,
      session: {
        id: session.id,
        state: session.current_state,
        progress: session.progress_percent,
        readiness: session.readiness_tier,
        consent_granted: session.app_config?.consent_granted || false,
      },
      messages: messages?.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to initialize Rob session:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
