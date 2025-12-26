import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { idea } = await request.json();

  if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
    return NextResponse.json({ error: 'Idea must be at least 10 characters' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('build_sessions')
    .insert({
      user_id: user.id,
      idea_description: idea.trim(),
      current_state: 'IDEA_CAPTURE',
      readiness_tier: 'DRAFT',
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? 'Failed to create session' }, { status: 500 });
  }

  const { error: receiptError } = await supabase.from('build_receipts').insert({
    session_id: session.id,
    type: 'session.created',
    details: {
      userId: user.id,
      idea: idea.trim(),
      state: session.current_state,
    },
  });

  if (receiptError) {
    return NextResponse.json({ error: receiptError.message }, { status: 500 });
  }

  return NextResponse.json({ session });
}
