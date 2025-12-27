/**
 * Payment Page - Stripe Elements Integration
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { createPaymentIntent, getBuildSession, BuildSession } from '../../../lib/api';
import PaymentForm from '../../../components/PaymentForm';
import Link from 'next/link';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function PaymentPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<BuildSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    loadSession();
  }, [params.sessionId]);

  const loadSession = async () => {
    try {
      const data = await getBuildSession(params.sessionId);
      setSession(data);

      // Redirect if already paid
      if (data.current_state !== 'PAYMENT_REQUIRED') {
        router.push(`/build/${params.sessionId}`);
        return;
      }

      // Create payment intent
      const paymentIntent = await createPaymentIntent(params.sessionId);
      setClientSecret(paymentIntent.clientSecret);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Redirect to build progress page
    router.push(`/build/${params.sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Session not found'}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const appName = session.config?.app_name || 'Your App';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/build/${params.sessionId}`} className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to Build
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Build: {appName}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">App Build</span>
                <span className="font-medium">$49.00</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>• Code Generation</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>• Deployment to Production</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>• GitHub Repository Access</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>• Vercel Project Access</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>$49.00 USD</span>
              </div>
            </div>
          </div>

          {/* Stripe Elements Payment Form */}
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
                  },
                },
              }}
            >
              <PaymentForm
                sessionId={params.sessionId}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )}

          {!clientSecret && !error && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Preparing payment form...</p>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🔒 Secure payment powered by Stripe</p>
          </div>
        </div>
      </main>
    </div>
  );
}
