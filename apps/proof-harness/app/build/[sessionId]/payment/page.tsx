/**
 * Payment Page - Stripe payment integration
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPaymentIntent, getBuildSession, BuildSession } from '../../../lib/api';
import Link from 'next/link';

export default function PaymentPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<BuildSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

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

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    setError('');

    try {
      // In a real implementation, this would integrate with Stripe Elements
      // For now, we'll just create the payment intent and show instructions
      const paymentIntent = await createPaymentIntent(params.sessionId);

      // TODO: Integrate Stripe Elements to actually process payment
      // For MVP, we can skip to next step or show manual payment instructions

      alert('Payment integration coming soon! For now, this is a placeholder.');

      // Redirect back to progress page
      router.push(`/build/${params.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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

          {/* Payment Form Placeholder */}
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Stripe Elements integration pending. This is a placeholder payment page.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}

            {/* Placeholder for Stripe Elements */}
            <div className="border border-gray-300 rounded-md p-8 text-center text-gray-400 mb-6">
              [Stripe Payment Form Will Appear Here]
              <div className="mt-4 text-sm">
                Card Number, Expiry, CVC fields
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {paymentLoading ? 'Processing...' : 'Pay $49.00'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>🔒 Secure payment powered by Stripe</p>
          </div>
        </div>
      </main>
    </div>
  );
}
