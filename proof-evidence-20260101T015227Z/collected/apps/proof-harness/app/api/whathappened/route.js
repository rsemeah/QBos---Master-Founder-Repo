"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const supabase_js_1 = require("@supabase/supabase-js");
exports.dynamic = 'force-dynamic';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');
        const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        // Fetch receipts
        let receiptQuery = supabase
            .from('rob_receipts')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(500);
        if (sessionId && sessionId !== 'all') {
            receiptQuery = receiptQuery.eq('session_id', sessionId);
        }
        const { data: receipts, error: receiptError } = await receiptQuery;
        if (receiptError) {
            console.error('Supabase error:', receiptError);
            return server_1.NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
        }
        // Transform receipts into human-readable timeline events
        const events = (receipts || []).map(receipt => {
            const event = receiptToEvent(receipt);
            return event;
        });
        return server_1.NextResponse.json({
            success: true,
            events,
            count: events.length,
        });
    }
    catch (error) {
        console.error('WhatHappened API error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
function receiptToEvent(receipt) {
    const type = receipt.type;
    const details = receipt.details || {};
    // Session events
    if (type === 'rob.session.created') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'session',
            engine: 'RobEngine',
            title: '🚀 New Session Started',
            description: `Rob started a new session for "${details.app_name || 'Untitled App'}"`,
            metadata: {
                template: details.template_id,
                state: details.current_state,
            },
        };
    }
    // Message events
    if (type === 'rob.message.received') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'message',
            engine: 'RobEngine',
            title: '💬 User Message',
            description: details.content?.substring(0, 100) || 'User sent a message',
            metadata: {
                role: 'user',
            },
        };
    }
    if (type === 'rob.message.sent') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'message',
            engine: 'RobEngine',
            title: '🤖 Rob Replied',
            description: details.content?.substring(0, 100) || 'Rob sent a response',
            metadata: {
                role: 'assistant',
            },
        };
    }
    // State transition events
    if (type === 'rob.state.transition') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'state',
            engine: 'RobEngine',
            title: '🔄 State Changed',
            description: `Rob moved from ${details.from_state} to ${details.to_state}`,
            metadata: {
                from: details.from_state,
                to: details.to_state,
                reason: details.reason,
            },
        };
    }
    // AI invocation events
    if (type === 'rob.ai.invoked') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'engine',
            engine: 'SilentEngine',
            title: '🧠 AI Called',
            description: `Rob consulted ${details.provider || 'AI'} (${details.model || 'unknown model'}) for ${details.purpose || 'assistance'}`,
            metadata: {
                provider: details.provider,
                model: details.model,
                tokens: details.tokens_total,
                latency: `${details.latency_ms}ms`,
            },
        };
    }
    // Code generation events
    if (type === 'rob.code.generated') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'code',
            engine: 'RobEngine',
            title: '💻 Code Generated',
            description: `Rob created ${details.component_name || 'a component'} with ${details.lines_of_code || '?'} lines of code`,
            metadata: {
                language: details.language,
                framework: details.framework,
                features: details.features?.length || 0,
            },
        };
    }
    // Repo creation events
    if (type === 'rob.repo.created') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'code',
            engine: 'RobEngine',
            title: '📦 GitHub Repo Created',
            description: `Rob created a GitHub repository at ${details.repo_url}`,
            metadata: {
                repo_name: details.repo_name,
                visibility: details.visibility,
            },
        };
    }
    // Consent events
    if (type === 'rob.consent.granted') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'engine',
            engine: 'CharterEngine',
            title: '✅ Consent Granted',
            description: `User gave consent for ${details.action || 'an action'}`,
            metadata: {
                action: details.action,
            },
        };
    }
    // Config events
    if (type === 'rob.config.changed') {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'engine',
            engine: 'ConfigEngine',
            title: '⚙️ Configuration Updated',
            description: `Changed ${details.key}: ${details.old_value} → ${details.new_value}`,
            metadata: {
                key: details.key,
                old_value: details.old_value,
                new_value: details.new_value,
            },
        };
    }
    // Error events
    if (type.includes('error')) {
        return {
            id: receipt.id,
            timestamp: receipt.created_at,
            type: 'error',
            engine: 'RobEngine',
            title: '❌ Error Occurred',
            description: details.error_message || 'An error occurred',
            metadata: {
                error_code: details.error_code,
                recovery: details.recovery_attempted,
            },
        };
    }
    // Default fallback
    return {
        id: receipt.id,
        timestamp: receipt.created_at,
        type: 'engine',
        engine: 'RobEngine',
        title: type,
        description: JSON.stringify(details).substring(0, 100),
    };
}
//# sourceMappingURL=route.js.map