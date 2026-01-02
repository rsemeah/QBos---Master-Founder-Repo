/**
 * Tests for /api/webhooks/stripe endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/stripe/route';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    rpc: jest.fn(),
  })),
}));

const mockSupabaseRpc = jest.fn();

// Mock ReceiptWriter
jest.mock('@/../../../packages/truthserum/src/ReceiptWriter', () => ({
  ReceiptWriter: jest.fn(() => ({
    write: jest.fn().mockResolvedValue({ id: 'receipt123', hash: 'hash123' }),
  })),
}));

describe('/api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when signature is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('No signature');
  });

  it('should return 400 when signature verification fails', async () => {
    const stripe = new (require('stripe'))();
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=invalid',
      },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid signature');
  });

  it('should process payment_intent.succeeded event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_123',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          amount: 4900,
          created: Math.floor(Date.now() / 1000),
          metadata: {
            sessionId: 'session123',
          },
        } as Stripe.PaymentIntent,
      },
      api_version: '2024-12-18.acacia',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 0,
      request: null,
    };

    const stripe = new (require('stripe'))();
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    mockSupabaseRpc.mockResolvedValue({ data: { id: 'job123' }, error: null });

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=valid',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);

    // Verify receipt was written
    const { ReceiptWriter } = require('@/../../../packages/truthserum/src/ReceiptWriter');
    const receiptWriter = new ReceiptWriter();
    expect(receiptWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session123',
        type: 'payment.verified',
      })
    );

    // Verify job was queued
    expect(mockSupabaseRpc).toHaveBeenCalledWith('queue_job', {
      p_session_id: 'session123',
      p_job_type: 'generate_code',
      p_payload: { sessionId: 'session123' },
    });
  });

  it('should ignore non-payment events', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_456',
      object: 'event',
      type: 'customer.created',
      data: {
        object: {} as any,
      },
      api_version: '2024-12-18.acacia',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 0,
      request: null,
    };

    const stripe = new (require('stripe'))();
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=valid',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);

    // Verify no receipt was written
    const { ReceiptWriter } = require('@/../../../packages/truthserum/src/ReceiptWriter');
    const receiptWriter = new ReceiptWriter();
    expect(receiptWriter.write).not.toHaveBeenCalled();
  });
});
