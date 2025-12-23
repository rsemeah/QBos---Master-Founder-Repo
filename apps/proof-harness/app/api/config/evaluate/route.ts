import { NextRequest, NextResponse } from 'next/server';
import { ConfigEngine } from '@qbos/config-engine-core';

const configEngine = new ConfigEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flagKey, userId, context } = body;

    if (!flagKey) {
      return NextResponse.json({
        ok: false,
        error: 'flagKey required',
      }, { status: 400 });
    }

    const evaluation = await configEngine.isEnabled(flagKey, { userId, ...context });

    return NextResponse.json({
      ok: true,
      data: evaluation,
      message: 'Feature flag evaluated via ConfigEngine',
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
