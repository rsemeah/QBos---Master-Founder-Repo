"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const stripe_1 = __importDefault(require("stripe"));
const supabase_js_1 = require("@supabase/supabase-js");
const truthserum_1 = require("@qbos/truthserum");
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function POST(request) {
    if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
        return server_1.NextResponse.json({ error: 'Missing payment configuration' }, { status: 500 });
    }
    const { sessionId } = await request.json();
    if (!sessionId) {
        return server_1.NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    const amountRaw = process.env.STRIPE_DEFAULT_AMOUNT_CENTS ?? '4900';
    const amount = Number.parseInt(amountRaw, 10);
    const currency = process.env.STRIPE_DEFAULT_CURRENCY ?? 'usd';
    if (!Number.isFinite(amount) || amount <= 0) {
        return server_1.NextResponse.json({ error: 'Invalid payment amount' }, { status: 500 });
    }
    const stripe = new stripe_1.default(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    const receiptWriter = new truthserum_1.ReceiptWriter(supabaseUrl, supabaseKey);
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
        return server_1.NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount,
            currency,
        });
    }
    catch (error) {
        console.error('[build/payment/create] Failed to create payment intent', error);
        return server_1.NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map