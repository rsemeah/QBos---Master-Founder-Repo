/**
 * CharterEngine™ - User Consent and Data Governance
 */
import type { ConsentRecord, ConsentPurpose, DataRightRequest, ConsentCheckResult } from './types';
export declare class CharterEngine {
    private consents;
    private dataRequests;
    /**
     * Record user consent
     */
    grantConsent(userId: string, purpose: ConsentPurpose, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        expiresInDays?: number;
        extra?: Record<string, unknown>;
    }): Promise<ConsentRecord>;
    /**
     * Withdraw consent
     */
    withdrawConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentRecord | null>;
    /**
     * Check if user has granted consent for purpose
     */
    checkConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentCheckResult>;
    /**
     * Get all consent records for user
     */
    getUserConsents(userId: string): Promise<ConsentRecord[]>;
    /**
     * Submit data right request (GDPR Article 15-20)
     */
    submitDataRequest(userId: string, type: DataRightRequest['type']): Promise<DataRightRequest>;
    /**
     * Get data request status
     */
    getDataRequest(requestId: string): Promise<DataRightRequest | null>;
    /**
     * List user's data requests
     */
    getUserDataRequests(userId: string): Promise<DataRightRequest[]>;
    /**
     * Process data request (admin/system operation)
     */
    processDataRequest(requestId: string, status: 'completed' | 'rejected', notes?: string): Promise<DataRightRequest | null>;
}
//# sourceMappingURL=charter.engine.d.ts.map