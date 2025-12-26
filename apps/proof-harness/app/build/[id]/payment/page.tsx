'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface BuildPaymentPageProps {
  params: { id: string };
}

interface PaymentFormProps {
  returnUrl: string;
}

function PaymentForm({ returnUrl }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setMessage(error.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
      <PaymentElement />
      {message && (
        <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{
          padding: '0.85rem 1.75rem',
          borderRadius: '999px',
          border: 'none',
          backgroundColor: '#1d4ed8',
          color: 'white',
          fontWeight: 600,
          cursor: submitting ? 'wait' : 'pointer',
        }}
      >
        {submitting ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
}

export default function BuildPaymentPage({ params }: BuildPaymentPageProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) return null;
    return loadStripe(key);
  }, []);

  const returnUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}/build/${params.id}/complete`;
  }, [params.id]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/build/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: params.id }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to start payment');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [params.id]);

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '720px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href={`/build/${params.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to progress
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Complete payment</h1>
        <p style={{ color: '#64748b' }}>
          Session ID: <strong>{params.id}</strong>
        </p>
      </header>

      <section
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
          display: 'grid',
          gap: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>Payment details</h2>
          <p style={{ color: '#64748b' }}>
            Payments are secured by Stripe. You will be redirected after confirmation.
          </p>
        </div>

        {loading && (
          <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
            Preparing secure checkout...
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        {!stripePromise && (
          <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#9a3412' }}>
            Missing Stripe publishable key. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.
          </div>
        )}

        {stripePromise && clientSecret && returnUrl && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <PaymentForm returnUrl={returnUrl} />
          </Elements>
        )}
      </section>
    </main>
  );
}
