import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get QBos version from env or package
    const qbosVersion = process.env.NEXT_PUBLIC_QBOS_VERSION || '1.0.0'

    // Try to get commit SHA (optional)
    let commitSha: string | undefined
    try {
      const { execSync } = require('child_process')
      commitSha = execSync('git rev-parse --short HEAD', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim()
    } catch {
      // Git not available or not in git repo
      commitSha = undefined
    }

    return NextResponse.json({
      ok: true,
      qbosVersion,
      commitSha,
      timestamp: new Date().toISOString(),
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
