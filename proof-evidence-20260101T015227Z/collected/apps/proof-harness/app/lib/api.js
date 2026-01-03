"use strict";
/**
 * API Client - Type-safe API wrapper functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBuild = startBuild;
exports.getBuildSession = getBuildSession;
exports.createPaymentIntent = createPaymentIntent;
exports.getUserSessions = getUserSessions;
/**
 * Start a new build session
 */
async function startBuild(ideaDescription) {
    const res = await fetch('/api/build/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaDescription }),
    });
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to start build');
    }
    return res.json();
}
/**
 * Get build session by ID
 */
async function getBuildSession(sessionId) {
    const res = await fetch(`/api/build/sessions?session_id=${sessionId}`);
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to get session');
    }
    const data = await res.json();
    return data.session;
}
/**
 * Create payment intent
 */
async function createPaymentIntent(sessionId) {
    const res = await fetch('/api/build/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to create payment intent');
    }
    return res.json();
}
/**
 * Get user's build sessions
 */
async function getUserSessions() {
    const res = await fetch('/api/build/sessions');
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to get sessions');
    }
    const data = await res.json();
    return data.sessions || [];
}
//# sourceMappingURL=api.js.map