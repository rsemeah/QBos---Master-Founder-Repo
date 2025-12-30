/**
 * POST /api/webhooks/stripe
 * CRITICAL: Stripe webhook handler for payment verification
 * This is the ONLY way payment.verified receipt is emitted
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { ReceiptWriter } from '@qbos/truthserum';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getStripe = () => {
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key missing');
  }
  return new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
};

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(supabaseUrl, supabaseKey);
};

const getReceiptWriter = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  return new ReceiptWriter(supabaseUrl, supabaseKey);
};

export async function POST(req: NextRequest) {
  let stripe: Stripe;
  let supabase: ReturnType<typeof getSupabase>;
  let receiptWriter: ReceiptWriter;

  try {
    stripe = getStripe();
    supabase = getSupabase();
    receiptWriter = getReceiptWriter();
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('[stripe/webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const sessionId = paymentIntent.metadata.sessionId;

    if (!sessionId) {
      console.error('[stripe/webhook] No sessionId in metadata');
      return NextResponse.json({ error: 'No sessionId' }, { status: 400 });
    }

    try {
      const paidAt = new Date(paymentIntent.created * 1000).toISOString();

      // Update session
      await supabase
        .from('build_sessions')
        .update({
          stripe_webhook_verified: true,
          paid_at: paidAt,
          current_state: 'CODE_GENERATING'
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      // Emit receipt (TruthSerum requirement)
      await receiptWriter.write({
        sessionId,
        type: 'payment.verified',
        details: {
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          paidAt,
          webhookVerified: true
        }
      });

      // Queue code generation job
      await supabase.rpc('queue_job', {
        p_session_id: sessionId,
        p_job_type: 'generate_code',
        p_payload: { sessionId }
      });

      console.log(`[stripe/webhook] Payment verified for session ${sessionId}`);

    } catch (error: any) {
      console.error('[stripe/webhook] Processing error:', error);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
