import { NextRequest, NextResponse } from 'next/server';
import { NotificationsEngine } from '@qbos/notifications-engine-core';

const notificationsEngine = new NotificationsEngine();

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

    await notificationsEngine.enqueue({ type, to, payload });
    const queueSize = await notificationsEngine.getQueueSize();

    return NextResponse.json({
      ok: true,
      data: { queueSize },
      message: 'Notification enqueued via NotificationsEngine',
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
