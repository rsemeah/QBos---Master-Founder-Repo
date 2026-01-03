import { NextResponse } from 'next/server';
type EngineStatus = 'available' | 'configured' | 'mock' | 'in-memory';
export declare function GET(): Promise<NextResponse<{
    ok: boolean;
    service: string;
    version: string;
    timestamp: string;
    engines: Record<string, EngineStatus>;
    database: string;
    integration: {
        persistence: boolean;
        aiGeneration: boolean;
        repoCreation: boolean;
        deploy: boolean;
        billing: boolean;
    };
    warnings: string[];
}>>;
export {};
//# sourceMappingURL=route.d.ts.map