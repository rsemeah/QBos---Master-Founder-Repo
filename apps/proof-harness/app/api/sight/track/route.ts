import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetType, tier, spec } = body;

    // SightEngine is optional/non-blocking
    const sightEnabled = process.env.SIGHT_ENGINE_ENABLED !== 'false';

    if (!sightEnabled) {
      return NextResponse.json({
        ok: true,
        tracked: false,
        warning: 'SightEngine disabled',
      });
    }

    // TODO: Integrate with SightEngine for visual quality tracking

    return NextResponse.json({
      ok: true,
      status: 'NOT_IMPLEMENTED',
      message: 'SightEngine integration pending',
      receivedParams: { assetType, tier, spec },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
