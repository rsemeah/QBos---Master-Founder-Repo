import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'qbos-proof-harness',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    engines: {
      silent: 'operational',
      sight: 'operational',
      safety: 'pending',
      charter: 'pending',
      identity: 'pending',
      config: 'pending',
      paywall: 'pending',
      notifications: 'pending',
      execution: 'pending',
    },
    database: process.env.SUPABASE_URL ? 'connected' : 'in-memory',
  });
}
