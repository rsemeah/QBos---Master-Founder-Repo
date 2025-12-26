/**
 * Tests for CharterEngine
 */

import { CharterEngine } from '../charter.engine';

describe('CharterEngine', () => {
  let engine: CharterEngine;

  beforeEach(() => {
    engine = new CharterEngine();
  });

  describe('grantConsent', () => {
    it('should grant consent for user', async () => {
      const consent = await engine.grantConsent('user123', 'analytics', {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
      });

      expect(consent.userId).toBe('user123');
      expect(consent.purpose).toBe('analytics');
      expect(consent.status).toBe('granted');
      expect(consent.ipAddress).toBe('127.0.0.1');
      expect(consent.grantedAt).toBeDefined();
    });

    it('should set expiry when specified', async () => {
      const consent = await engine.grantConsent('user123', 'marketing', {
        expiresInDays: 30,
      });

      expect(consent.expiresAt).toBeDefined();
      const expiryDate = new Date(consent.expiresAt!);
      const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      expect(expiryDate.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
    });
  });

  describe('checkConsent', () => {
    it('should allow essential purposes without explicit consent', async () => {
      const result = await engine.checkConsent('user123', 'essential');

      expect(result.allowed).toBe(true);
      expect(result.purpose).toBe('essential');
      expect(result.reason).toContain('Essential');
    });

    it('should deny consent when not granted', async () => {
      const result = await engine.checkConsent('user123', 'marketing');

      expect(result.allowed).toBe(false);
      expect(result.purpose).toBe('marketing');
      expect(result.reason).toContain('No consent record');
    });

    it('should allow consent when granted', async () => {
      await engine.grantConsent('user123', 'analytics');

      const result = await engine.checkConsent('user123', 'analytics');

      expect(result.allowed).toBe(true);
      expect(result.purpose).toBe('analytics');
      expect(result.record).toBeDefined();
    });

    it('should deny expired consent', async () => {
      await engine.grantConsent('user123', 'marketing', {
        expiresInDays: -1, // Already expired
      });

      const result = await engine.checkConsent('user123', 'marketing');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('should deny withdrawn consent', async () => {
      await engine.grantConsent('user123', 'analytics');
      await engine.withdrawConsent('user123', 'analytics');

      const result = await engine.checkConsent('user123', 'analytics');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('withdrawn');
    });
  });

  describe('withdrawConsent', () => {
    it('should withdraw existing consent', async () => {
      await engine.grantConsent('user123', 'marketing');

      const withdrawn = await engine.withdrawConsent('user123', 'marketing');

      expect(withdrawn).not.toBeNull();
      expect(withdrawn!.status).toBe('withdrawn');
      expect(withdrawn!.withdrawnAt).toBeDefined();
    });

    it('should return null when consent does not exist', async () => {
      const result = await engine.withdrawConsent('user123', 'marketing');

      expect(result).toBeNull();
    });
  });

  describe('getUserConsents', () => {
    it('should return all consents for user', async () => {
      await engine.grantConsent('user123', 'analytics');
      await engine.grantConsent('user123', 'marketing');

      const consents = await engine.getUserConsents('user123');

      expect(consents).toHaveLength(2);
      expect(consents.map(c => c.purpose)).toContain('analytics');
      expect(consents.map(c => c.purpose)).toContain('marketing');
    });

    it('should return empty array when no consents', async () => {
      const consents = await engine.getUserConsents('user123');

      expect(consents).toHaveLength(0);
    });
  });

  describe('submitDataRequest', () => {
    it('should create data request', async () => {
      const request = await engine.submitDataRequest('user123', 'access');

      expect(request.userId).toBe('user123');
      expect(request.type).toBe('access');
      expect(request.status).toBe('pending');
      expect(request.requestedAt).toBeDefined();
    });
  });

  describe('processDataRequest', () => {
    it('should complete data request', async () => {
      const request = await engine.submitDataRequest('user123', 'erasure');

      const processed = await engine.processDataRequest(
        request.id,
        'completed',
        'Data has been erased'
      );

      expect(processed).not.toBeNull();
      expect(processed!.status).toBe('completed');
      expect(processed!.notes).toBe('Data has been erased');
      expect(processed!.completedAt).toBeDefined();
    });

    it('should return null for non-existent request', async () => {
      const result = await engine.processDataRequest('fake-id', 'completed');

      expect(result).toBeNull();
    });
  });

  describe('getUserDataRequests', () => {
    it('should return all data requests for user', async () => {
      await engine.submitDataRequest('user123', 'access');
      await engine.submitDataRequest('user123', 'portability');

      const requests = await engine.getUserDataRequests('user123');

      expect(requests).toHaveLength(2);
      expect(requests.map(r => r.type)).toContain('access');
      expect(requests.map(r => r.type)).toContain('portability');
    });
  });
});
