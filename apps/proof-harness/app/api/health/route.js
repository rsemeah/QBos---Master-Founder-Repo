"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
function getEnvFlag(value) {
    return Boolean(value && value.trim().length > 0);
}
async function GET() {
    const hasSupabaseUrl = getEnvFlag(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseServiceKey = getEnvFlag(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const hasOpenAI = getEnvFlag(process.env.OPENAI_API_KEY);
    const hasAnthropic = getEnvFlag(process.env.ANTHROPIC_API_KEY);
    const hasGoogle = getEnvFlag(process.env.GOOGLE_API_KEY);
    const hasGroq = getEnvFlag(process.env.GROQ_API_KEY);
    const hasGitHub = getEnvFlag(process.env.GITHUB_TOKEN);
    const hasVercel = getEnvFlag(process.env.VERCEL_TOKEN);
    const hasStripe = getEnvFlag(process.env.STRIPE_SECRET_KEY);
    const aiConfigured = hasOpenAI || hasAnthropic || hasGoogle || hasGroq;
    const persistenceConfigured = hasSupabaseUrl && hasSupabaseServiceKey;
    const engines = {
        silent: aiConfigured ? 'configured' : 'mock',
        sight: 'available',
        safety: 'available',
        charter: persistenceConfigured ? 'configured' : 'in-memory',
        identity: persistenceConfigured ? 'configured' : 'in-memory',
        config: persistenceConfigured ? 'configured' : 'in-memory',
        paywall: hasStripe ? 'configured' : 'mock',
        notifications: 'available',
        execution: 'available',
    };
    const integration = {
        persistence: persistenceConfigured,
        aiGeneration: aiConfigured,
        repoCreation: hasGitHub,
        deploy: hasVercel,
        billing: hasStripe,
    };
    const warnings = [];
    if (!persistenceConfigured) {
        warnings.push('Supabase persistence is not configured.');
    }
    if (!aiConfigured) {
        warnings.push('No AI provider keys configured; SilentEngine is in mock mode.');
    }
    if (!hasGitHub) {
        warnings.push('GitHub token is missing; repo creation will be unavailable.');
    }
    if (!hasVercel) {
        warnings.push('Vercel token is missing; deployments will be unavailable.');
    }
    if (!hasStripe) {
        warnings.push('Stripe secret key missing; billing will be unavailable.');
    }
    return server_1.NextResponse.json({
        ok: true,
        service: 'qbos-proof-harness',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        engines,
        database: persistenceConfigured ? 'connected' : 'in-memory',
        integration,
        warnings,
    });
}
//# sourceMappingURL=route.js.map