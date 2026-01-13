import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ReceiptWriter } from '@qbos/truthserum';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload || !payload.signature || !payload.signerKeyId) {
      return NextResponse.json({ error: 'Missing signature or signerKeyId' }, { status: 400 });
    }

    // Verify signature using ReceiptWriter helper (canonicalization + keystore)
    const valid = await ReceiptWriter.verifyReceipt(payload);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Persist receipt into build_receipts (append-only)
    const { data, error } = await supabase.from('build_receipts').insert([
      {
        session_id: payload.sessionId || null,
        type: payload.type || 'unknown',
        details: payload.details || {},
        signature: payload.signature,
        signer_key_id: payload.signerKeyId,
        verification_hash: payload.verification_hash || null,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error('[submit-signed] supabase insert error', error);
      return NextResponse.json({ error: 'Failed to persist receipt' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted: data });
  } catch (err) {
    console.error('[submit-signed] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
