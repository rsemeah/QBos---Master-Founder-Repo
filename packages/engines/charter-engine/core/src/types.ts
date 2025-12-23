/**
 * CharterEngine™ Types
 */

export type ConsentPurpose = 'ai' | 'analytics' | 'marketing' | 'essential' | 'ai_processing';
export type ConsentStatus = 'granted' | 'denied' | 'withdrawn';

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  grantedAt: string;
  expiresAt?: string;
  withdrawnAt?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface DataRightRequest {
  id: string;
  userId: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface ConsentCheckResult {
  allowed: boolean;
  purpose: ConsentPurpose;
  record?: ConsentRecord;
  reason?: string;
}
