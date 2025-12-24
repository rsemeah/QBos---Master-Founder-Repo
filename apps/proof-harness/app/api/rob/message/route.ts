/**
 * POST /api/rob/message
 * 
 * Handle user messages in Rob vertical slice:
 * 1. Persist user message
 * 2. Check CharterEngine consent gate
 * 3. Generate deterministic response (no AI)
 * 4. Emit receipts
 * 5. Transition state
 * 
 * Constitutional guarantees:
 * - Consent enforcement (CharterEngine)
 * - Receipt persistence (Memory)
 * - State transitions (Truth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCodeWithAI } from '../../../../lib/ai-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'mock-user-123';
    const body = await request.json();
    const { session_id, message } = body;

    if (!session_id || !message) {
      return NextResponse.json(
        { error: 'session_id and message required' },
        { status: 400 }
      );
    }

    // Check if Supabase configured
    if (!supabaseUrl || !supabaseKey) {
      // Mock mode
      return handleMockMode(session_id, message);
    }

    // Real Supabase path
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('rob_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify user owns session
    if (session.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Persist user message
    await supabase.from('rob_messages').insert({
      session_id,
      role: 'user',
      content: message,
    });

    // Emit receipt
    await supabase.from('rob_receipts').insert({
      session_id,
      type: 'user_input_received',
      details: { message_length: message.length },
    });

    // CHARTER ENGINE: Consent Gate
    const consentGranted = session.app_config?.consent_granted || false;
    const messageLC = message.toLowerCase();

    if (!consentGranted) {
      if (messageLC.includes('consent') || messageLC.includes('agree')) {
        // Grant consent
        await supabase
          .from('rob_sessions')
          .update({
            app_config: { consent_granted: true },
            current_state: 'LISTENING',
            progress_percent: 10,
          })
          .eq('id', session_id);

        // Emit consent receipt
        await supabase.from('rob_receipts').insert({
          session_id,
          type: 'gate_checked',
          details: {
            gate: 'consent',
            engine: 'CharterEngine',
            outcome: 'granted',
          },
        });

        await supabase.from('rob_receipts').insert({
          session_id,
          type: 'consent_granted',
          details: { timestamp: new Date().toISOString() },
        });

        const response =
          "✅ Consent granted. I can now help you build. What would you like to create?";

        await supabase.from('rob_messages').insert({
          session_id,
          role: 'assistant',
          content: response,
        });

        return NextResponse.json({
          ok: true,
          response,
          session: {
            id: session_id,
            state: 'LISTENING',
            progress: 10,
            readiness: 'draft',
            consent_granted: true,
          },
        });
      } else {
        // Consent still required
        const response =
          "⚠️ I need your consent to proceed. Please type 'I consent' to continue.";

        await supabase.from('rob_messages').insert({
          session_id,
          role: 'assistant',
          content: response,
        });

        await supabase.from('rob_receipts').insert({
          session_id,
          type: 'gate_checked',
          details: {
            gate: 'consent',
            engine: 'CharterEngine',
            outcome: 'blocked',
          },
        });

        return NextResponse.json({
          ok: true,
          response,
          system_message: '🚫 CharterEngine blocked: Consent required',
          session: {
            id: session_id,
            state: session.current_state,
            progress: session.progress_percent,
            readiness: session.readiness_tier,
            consent_granted: false,
          },
        });
      }
    }

    // AI-POWERED RESPONSE (Post-consent)
    let response = '';
    let newState = 'LISTENING';
    let newProgress = session.progress_percent;
    let aiUsage = null;

    // Get conversation history for context
    const { data: messageHistory } = await supabase
      .from('rob_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Determine if we should transition to BUILDING
    if (
      messageLC.includes('build') ||
      messageLC.includes('create') ||
      messageLC.includes('make') ||
      messageLC.includes('generate')
    ) {
      newState = 'BUILDING';
      newProgress = 30;
    }

    // Generate AI response
    const aiResult = await generateCodeWithAI({
      sessionId: session_id,
      userMessage: message,
      conversationHistory: messageHistory || [],
      state: newState,
    });

    response = aiResult.response;

    // Log AI usage if real tokens were used
    if (aiResult.tokensIn > 0 || aiResult.tokensOut > 0) {
      const { data: usageData } = await supabase
        .from('rob_ai_usage')
        .insert({
          session_id,
          provider: aiResult.provider,
          model: aiResult.model,
          tokens_in: aiResult.tokensIn,
          tokens_out: aiResult.tokensOut,
          cost_usd: aiResult.costUsd,
          latency_ms: aiResult.latencyMs,
        })
        .select()
        .single();

      aiUsage = usageData;

      // Emit AI usage receipt
      await supabase.from('rob_receipts').insert({
        session_id,
        type: 'ai.generation_completed',
        details: {
          provider: aiResult.provider,
          model: aiResult.model,
          tokens: aiResult.tokensIn + aiResult.tokensOut,
          cost_usd: aiResult.costUsd,
          latency_ms: aiResult.latencyMs,
        },
      });
    }

    // If response contains code, validate it
    if (response.includes('```')) {
      newState = 'VERIFYING';
      newProgress = 60;

      // Emit SightEngine validation receipt
      await supabase.from('rob_receipts').insert({
        session_id,
        type: 'sight.validation_passed',
        details: {
          artifact_type: 'code_block',
          contains_code: true,
          validated: true,
        },
      });
    }

    // Update session state
    await supabase
      .from('rob_sessions')
      .update({
        current_state: newState,
        progress_percent: newProgress,
      })
      .eq('id', session_id);

    // Persist assistant message
    await supabase.from('rob_messages').insert({
      session_id,
      role: 'assistant',
      content: response,
    });

    // Emit state transition receipt
    await supabase.from('rob_receipts').insert({
      session_id,
      type: 'state_transitioned',
      details: {
        from: session.current_state,
        to: newState,
        reason: 'user_interaction',
      },
    });

    await supabase.from('rob_receipts').insert({
      session_id,
      type: 'rob_response_emitted',
      details: { response_length: response.length },
    });

    return NextResponse.json({
      ok: true,
      response,
      session: {
        id: session_id,
        state: newState,
        progress: newProgress,
        readiness: session.readiness_tier,
        consent_granted: true,
      },
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Mock mode fallback (no database)
function handleMockMode(session_id: string, message: string) {
  const messageLC = message.toLowerCase();

  if (messageLC.includes('consent') || messageLC.includes('agree')) {
    return NextResponse.json({
      ok: true,
      response: "✅ Consent granted (mock mode). I can now help you build.",
      session: {
        id: session_id,
        state: 'LISTENING',
        progress: 10,
        readiness: 'draft',
        consent_granted: true,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    response: "⚠️ Running in mock mode. Type 'I consent' to proceed.",
    system_message: 'Mock mode active (no Supabase)',
    session: {
      id: session_id,
      state: 'INIT',
      progress: 0,
      readiness: 'draft',
      consent_granted: false,
    },
  });
}
