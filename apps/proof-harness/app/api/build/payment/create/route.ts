import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { ReceiptWriter } from '@qbos/truthserum';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing payment configuration' }, { status: 500 });
  }

  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const amountRaw = process.env.STRIPE_DEFAULT_AMOUNT_CENTS ?? '4900';
  const amount = Number.parseInt(amountRaw, 10);
  const currency = process.env.STRIPE_DEFAULT_CURRENCY ?? 'usd';

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid payment amount' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });
  const supabase = createClient(supabaseUrl, supabaseKey);
  const receiptWriter = new ReceiptWriter(supabaseUrl, supabaseKey);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { sessionId },
      automatic_payment_methods: { enabled: true },
    });

    await supabase
      .from('build_sessions')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        current_state: 'PAYMENT_PROCESSING',
      })
      .eq('id', sessionId);

    await receiptWriter.write({
      sessionId,
      type: 'payment.intent_created',
      details: {
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
    });
  } catch (error: any) {
    console.error('[build/payment/create] Failed to create payment intent', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
