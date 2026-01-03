import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
interface TimelineEvent {
    id: string;
    timestamp: string;
    type: 'session' | 'message' | 'state' | 'code' | 'engine' | 'error';
    engine: string;
    title: string;
    description: string;
    metadata?: Record<string, any>;
}
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    events: TimelineEvent[];
    count: number;
}> | NextResponse<{
    error: any;
}>>;
export {};
//# sourceMappingURL=route.d.ts.map