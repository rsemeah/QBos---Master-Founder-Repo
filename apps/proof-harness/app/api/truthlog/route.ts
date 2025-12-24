import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const engines = searchParams.get('engines')?.split(',') || [];

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('rob_receipts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (sessionId && sessionId !== 'all') {
      query = query.eq('session_id', sessionId);
    }

    if (engines.length > 0) {
      // Filter by receipt types that match engine prefixes
      const typeFilters = engines.map(engine => `${engine}.`);
      query = query.or(
        typeFilters.map(prefix => `type.ilike.${prefix}%`).join(',')
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch receipts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      receipts: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('TruthLog API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
