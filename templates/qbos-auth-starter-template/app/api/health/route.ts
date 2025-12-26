/**
 * Health Check Endpoint
 * Used by QuietBuild OS to verify deployment
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'qbos-auth-starter',
  });
}
