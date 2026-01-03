"use strict";
// Rob API Client - Constitutional Integration
// NO MOCKS. Real API calls only.
Object.defineProperty(exports, "__esModule", { value: true });
exports.robClient = void 0;
class RobClient {
    baseUrl = '/api/rob';
    async initSession(templateId = 'minimal-vertical-slice') {
        const res = await fetch(`${this.baseUrl}/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template_id: templateId }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to initialize session');
        }
        return res.json();
    }
    async sendMessage(sessionId, message) {
        const res = await fetch(`${this.baseUrl}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, message }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to send message');
        }
        return res.json();
    }
    // Add receipt querying when backend supports it
    async getReceipts(sessionId) {
        try {
            const res = await fetch(`/api/receipts?sessionId=${encodeURIComponent(sessionId)}`);
            if (!res.ok)
                return [];
            const data = await res.json();
            return data.receipts || [];
        }
        catch (err) {
            console.error('Failed to fetch receipts', err);
            return [];
        }
    }
    async writeReceipt(receipt) {
        try {
            const res = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receipt),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to write receipt');
            }
            const data = await res.json();
            return data.receipt;
        }
        catch (error) {
            console.error('writeReceipt error:', error);
            return null;
        }
    }
}
exports.robClient = new RobClient();
//# sourceMappingURL=rob-client.js.map