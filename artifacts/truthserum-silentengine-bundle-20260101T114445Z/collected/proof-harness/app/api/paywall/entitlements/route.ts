import { NextRequest, NextResponse } from 'next/server';
import { PaywallEngine } from '@qbos/paywall-engine-core';

const paywallEngine = new PaywallEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, orgId } = body;

    if (!userId && !orgId) {
      return NextResponse.json({
        ok: false,
        error: 'userId or orgId required',
      }, { status: 400 });
    }

    const entitlements = await paywallEngine.getEntitlements(userId, orgId);

    return NextResponse.json({
      ok: true,
      data: entitlements,
      message: 'Entitlements retrieved via PaywallEngine',
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
