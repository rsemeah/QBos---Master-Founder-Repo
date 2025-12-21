import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ConsentBody {
  userId: string
  documentType: string
  version: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ConsentBody = await request.json()

    // Validate required fields
    if (!body.userId || !body.documentType || !body.version) {
      return NextResponse.json({
        ok: false,
        error: 'userId, documentType, and version are required',
      }, { status: 400 })
    }

    // CharterEngine is not yet implemented - this is a stub
    // When CharterEngine exists, this would call:
    // const consent = await charterEngine.acceptConsent(body)
    // return NextResponse.json({ ok: true, consent_id: consent.id })

    const stubbed = true
    const consent_id = `consent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    console.log('[CharterEngine] Consent accepted (stubbed):', {
      userId: body.userId,
      documentType: body.documentType,
      version: body.version,
      consent_id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      stubbed,
      consent_id,
      userId: body.userId,
      documentType: body.documentType,
      version: body.version,
      acceptedAt: new Date().toISOString(),
      message: 'CharterEngine not yet implemented - consent stored in stub format',
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
