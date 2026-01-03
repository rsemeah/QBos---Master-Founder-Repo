"use strict";
/**
 * CharterEngine™ - User Consent and Data Governance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharterEngine = void 0;
class CharterEngine {
    consents = new Map();
    dataRequests = new Map();
    /**
     * Record user consent
     */
    async grantConsent(userId, purpose, metadata) {
        const record = {
            id: `consent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId,
            purpose,
            status: 'granted',
            grantedAt: new Date().toISOString(),
            expiresAt: metadata?.expiresInDays
                ? new Date(Date.now() + metadata.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
                : undefined,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            metadata: metadata?.extra,
        };
        const key = `${userId}:${purpose}`;
        this.consents.set(key, record);
        return record;
    }
    /**
     * Withdraw consent
     */
    async withdrawConsent(userId, purpose) {
        const key = `${userId}:${purpose}`;
        const existing = this.consents.get(key);
        if (!existing) {
            return null;
        }
        const updated = {
            ...existing,
            status: 'withdrawn',
            withdrawnAt: new Date().toISOString(),
        };
        this.consents.set(key, updated);
        return updated;
    }
    /**
     * Check if user has granted consent for purpose
     */
    async checkConsent(userId, purpose) {
        // Essential purposes always allowed
        if (purpose === 'essential') {
            return {
                allowed: true,
                purpose,
                reason: 'Essential functionality does not require explicit consent',
            };
        }
        const key = `${userId}:${purpose}`;
        const record = this.consents.get(key);
        if (!record) {
            return {
                allowed: false,
                purpose,
                reason: 'No consent record found',
            };
        }
        if (record.status !== 'granted') {
            return {
                allowed: false,
                purpose,
                record,
                reason: `Consent was ${record.status}`,
            };
        }
        // Check expiry
        if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
            return {
                allowed: false,
                purpose,
                record,
                reason: 'Consent has expired',
            };
        }
        return {
            allowed: true,
            purpose,
            record,
        };
    }
    /**
     * Get all consent records for user
     */
    async getUserConsents(userId) {
        return Array.from(this.consents.values()).filter((c) => c.userId === userId);
    }
    /**
     * Submit data right request (GDPR Article 15-20)
     */
    async submitDataRequest(userId, type) {
        const request = {
            id: `datareq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId,
            type,
            status: 'pending',
            requestedAt: new Date().toISOString(),
        };
        this.dataRequests.set(request.id, request);
        return request;
    }
    /**
     * Get data request status
     */
    async getDataRequest(requestId) {
        return this.dataRequests.get(requestId) || null;
    }
    /**
     * List user's data requests
     */
    async getUserDataRequests(userId) {
        return Array.from(this.dataRequests.values()).filter((r) => r.userId === userId);
    }
    /**
     * Process data request (admin/system operation)
     */
    async processDataRequest(requestId, status, notes) {
        const request = this.dataRequests.get(requestId);
        if (!request) {
            return null;
        }
        const updated = {
            ...request,
            status,
            completedAt: new Date().toISOString(),
            notes,
        };
        this.dataRequests.set(requestId, updated);
        return updated;
    }
}
exports.CharterEngine = CharterEngine;
//# sourceMappingURL=charter.engine.js.map