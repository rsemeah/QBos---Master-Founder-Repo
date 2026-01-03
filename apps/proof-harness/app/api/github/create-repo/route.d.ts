/**
 * GitHub Integration for Rob
 *
 * POST /api/github/create-repo
 *
 * Creates a GitHub repository with generated code
 *
 * Constitutional guarantees:
 * - Auth required (NextAuth session)
 * - Receipt generation
 * - Error handling
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    repo: {
        name: string;
        url: string;
        clone_url: string;
        owner: string;
    };
}>>;
//# sourceMappingURL=route.d.ts.map