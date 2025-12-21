import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TrackEventBody {
  eventType: string
  eventName: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackEventBody = await request.json()

    // Validate required fields
    if (!body.eventType || !body.eventName) {
      return NextResponse.json({
        ok: false,
        error: 'eventType and eventName are required',
      }, { status: 400 })
    }

    // SightEngine tracking (non-blocking)
    // This is a stub - in production, this would integrate with actual SightEngine
    const trackingEnabled = process.env.SIGHTENGINE_TRACKING_ENABLED !== 'false'

    let warning: string | undefined

    if (!trackingEnabled) {
      warning = 'SightEngine tracking is disabled'
      // Log but don't fail
      console.log('[SightEngine] Tracking disabled:', body)
    } else {
      // Non-blocking tracking
      // In production, this would call SightEngine.track()
      setImmediate(() => {
        try {
          // Simulate tracking
          console.log('[SightEngine] Track event:', {
            type: body.eventType,
            name: body.eventName,
            userId: body.userId,
            sessionId: body.sessionId,
            properties: body.properties,
            timestamp: new Date().toISOString(),
          })

          // In production, this would be:
          // await sightEngine.track(body)
          // But we don't fail the request if tracking fails
        } catch (error) {
          console.error('[SightEngine] Tracking failed (non-blocking):', error)
        }
      })
    }

    return NextResponse.json({
      ok: true,
      tracked: trackingEnabled,
      warning,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
