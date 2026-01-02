import { NextRequest, NextResponse } from 'next/server';
import { CharterEngine } from '@qbos/charter-engine-core';

const charterEngine = new CharterEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, purpose } = body;

    if (!userId || !purpose) {
      return NextResponse.json({
        ok: false,
        error: 'userId and purpose required',
      }, { status: 400 });
    }

    const record = await charterEngine.grantConsent(userId, purpose as any, {
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      ok: true,
      data: record,
      message: 'Consent granted via CharterEngine',
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
