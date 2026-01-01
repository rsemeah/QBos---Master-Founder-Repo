import { NextRequest, NextResponse } from 'next/server';
import { validateAsset, calculateQualityScore } from '@qbos/sight-engine';

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

    if (!assetType || !tier) {
      return NextResponse.json({
        ok: false,
        error: 'assetType and tier required',
      }, { status: 400 });
    }

    // Validate asset spec
    const validation = validateAsset(spec, assetType, tier);
    const qualityScore = calculateQualityScore(spec, tier);

    return NextResponse.json({
      ok: true,
      tracked: true,
      data: {
        validation,
        qualityScore,
        meetsStandards: validation.passed,
      },
      message: 'Visual quality validated via SightEngine',
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
