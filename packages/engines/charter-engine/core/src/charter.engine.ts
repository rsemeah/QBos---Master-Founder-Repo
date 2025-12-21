/**
 * CharterEngine™ - User Consent and Data Governance
 */

import type {
  ConsentRecord,
  ConsentPurpose,
  ConsentStatus,
  DataRightRequest,
  ConsentCheckResult,
} from './types';

export class CharterEngine {
  private consents: Map<string, ConsentRecord> = new Map();
  private dataRequests: Map<string, DataRightRequest> = new Map();

  /**
   * Record user consent
   */
  async grantConsent(
    userId: string,
    purpose: ConsentPurpose,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      expiresInDays?: number;
      extra?: Record<string, unknown>;
    }
  ): Promise<ConsentRecord> {
    const record: ConsentRecord = {
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
  async withdrawConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentRecord | null> {
    const key = `${userId}:${purpose}`;
    const existing = this.consents.get(key);

    if (!existing) {
      return null;
    }

    const updated: ConsentRecord = {
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
  async checkConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentCheckResult> {
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
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values()).filter((c) => c.userId === userId);
  }

  /**
   * Submit data right request (GDPR Article 15-20)
   */
  async submitDataRequest(
    userId: string,
    type: DataRightRequest['type']
  ): Promise<DataRightRequest> {
    const request: DataRightRequest = {
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
  async getDataRequest(requestId: string): Promise<DataRightRequest | null> {
    return this.dataRequests.get(requestId) || null;
  }

  /**
   * List user's data requests
   */
  async getUserDataRequests(userId: string): Promise<DataRightRequest[]> {
    return Array.from(this.dataRequests.values()).filter((r) => r.userId === userId);
  }

  /**
   * Process data request (admin/system operation)
   */
  async processDataRequest(
    requestId: string,
    status: 'completed' | 'rejected',
    notes?: string
  ): Promise<DataRightRequest | null> {
    const request = this.dataRequests.get(requestId);
    if (!request) {
      return null;
    }

    const updated: DataRightRequest = {
      ...request,
      status,
      completedAt: new Date().toISOString(),
      notes,
    };

    this.dataRequests.set(requestId, updated);
    return updated;
  }
}
