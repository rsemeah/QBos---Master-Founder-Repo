import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, payload } = body;

    if (!type || !to) {
      return NextResponse.json({
        ok: false,
        error: 'type and to required',
      }, { status: 400 });
    }

    // TODO: Implement NotificationsEngine queue

    return NextResponse.json({
      ok: true,
      status: 'NOT_IMPLEMENTED',
      message: 'NotificationsEngine not yet implemented',
      receivedParams: { type, to, payload },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
