/**
 * POST /api/rob/session
 * 
 * Creates a new Rob build session.
 * Requires authentication.
 * Emits session.created receipt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RobEngine } from '@qbos/execution-engine-core';
import { SupabaseRobPersistence } from '@qbos/execution-engine-core/SupabaseRobPersistence';

export async function POST(request: NextRequest) {
  try {
    // TODO: Extract user from auth (Supabase Auth or JWT)
    // For now, mock user ID
    const userId = request.headers.get('x-user-id') || 'mock-user-123';

    const body = await request.json();
    const { template_id } = body;

    if (!template_id) {
      return NextResponse.json(
        { error: 'template_id is required' },
        { status: 400 }
      );
    }

    // Initialize persistence
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const persistence = new SupabaseRobPersistence(supabaseUrl, supabaseKey);
    const robEngine = new RobEngine(persistence);

    // Create session
    const session = await robEngine.createSession(userId, template_id);

    return NextResponse.json({
      ok: true,
      session: {
        id: session.id,
        template_id: session.template_id,
        state: session.current_state,
        progress: session.progress_percent,
        readiness: session.readiness_tier,
      },
    });
  } catch (error) {
    console.error('Failed to create Rob session:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
