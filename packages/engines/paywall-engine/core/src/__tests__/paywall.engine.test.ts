/**
 * Tests for PaywallEngine
 */

import { PaywallEngine } from '../paywall.engine';

describe('PaywallEngine', () => {
  let engine: PaywallEngine;

  beforeEach(() => {
    engine = new PaywallEngine();
  });

  describe('getPlan', () => {
    it('should return free plan', async () => {
      const plan = await engine.getPlan('free');

      expect(plan).not.toBeNull();
      expect(plan!.id).toBe('free');
      expect(plan!.tier).toBe('free');
      expect(plan!.price).toBe(0);
    });

    it('should return pro plan', async () => {
      const plan = await engine.getPlan('pro');

      expect(plan).not.toBeNull();
      expect(plan!.id).toBe('pro');
      expect(plan!.tier).toBe('pro');
      expect(plan!.price).toBe(49);
    });
  });

  describe('listPlans', () => {
    it('should return all plans', async () => {
      const plans = await engine.listPlans();

      expect(plans.length).toBeGreaterThanOrEqual(2);
      expect(plans.map(p => p.id)).toContain('free');
      expect(plans.map(p => p.id)).toContain('pro');
    });
  });

  describe('createSubscription', () => {
    it('should create subscription for user', async () => {
      const subscription = await engine.createSubscription('user123', 'pro');

      expect(subscription.userId).toBe('user123');
      expect(subscription.planId).toBe('pro');
      expect(subscription.status).toBe('active');
      expect(subscription.startedAt).toBeDefined();
    });

    it('should create subscription with trial', async () => {
      const subscription = await engine.createSubscription('user123', 'pro', {
        trialDays: 14,
      });

      expect(subscription.trialEndsAt).toBeDefined();

      const trialEnd = new Date(subscription.trialEndsAt!);
      const expectedEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      expect(trialEnd.getTime()).toBeCloseTo(expectedEnd.getTime(), -2);
    });

    it('should throw error for non-existent plan', async () => {
      await expect(
        engine.createSubscription('user123', 'non-existent')
      ).rejects.toThrow();
    });
  });

  describe('getSubscription', () => {
    it('should return subscription for user', async () => {
      await engine.createSubscription('user123', 'pro');

      const subscription = await engine.getSubscription('user123');

      expect(subscription).not.toBeNull();
      expect(subscription!.userId).toBe('user123');
      expect(subscription!.planId).toBe('pro');
    });

    it('should return null when no subscription exists', async () => {
      const subscription = await engine.getSubscription('user456');

      expect(subscription).toBeNull();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      await engine.createSubscription('user123', 'pro');

      const cancelled = await engine.cancelSubscription('user123');

      expect(cancelled).not.toBeNull();
      expect(cancelled!.status).toBe('suspended');
      expect(cancelled!.cancelledAt).toBeDefined();
    });
  });

  describe('checkEntitlement', () => {
    it('should deny access without subscription', async () => {
      const result = await engine.checkEntitlement('user123', 'priority_support');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No active subscription');
    });

    it('should allow access to features in plan', async () => {
      await engine.createSubscription('user123', 'pro');

      const result = await engine.checkEntitlement('user123', 'analytics');

      expect(result.allowed).toBe(true);
      expect(result.plan).toBeDefined();
    });

    it('should deny access to features not in plan', async () => {
      await engine.createSubscription('user123', 'free');

      const result = await engine.checkEntitlement('user123', 'analytics');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in plan');
    });

    it('should deny access when subscription is cancelled', async () => {
      await engine.createSubscription('user123', 'pro');
      await engine.cancelSubscription('user123');

      const result = await engine.checkEntitlement('user123', 'analytics');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('suspended');
    });
  });

  describe('checkUsageLimit', () => {
    it('should allow usage under limit', async () => {
      await engine.createSubscription('user123', 'free');
      await engine.recordUsage('user123', 'maxAIRequests', 50);

      const result = await engine.checkUsageLimit('user123', 'maxAIRequests');

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(50);
      expect(result.limit).toBe(100); // Free plan limit
    });

    it('should deny usage at limit', async () => {
      await engine.createSubscription('user123', 'free');
      await engine.recordUsage('user123', 'maxAIRequests', 100);

      const result = await engine.checkUsageLimit('user123', 'maxAIRequests');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('limit reached');
    });

    it('should allow unlimited usage when no limit defined', async () => {
      await engine.createSubscription('user123', 'free');

      const result = await engine.checkUsageLimit('user123', 'unlimitedFeature');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBeUndefined();
    });
  });

  describe('recordUsage', () => {
    it('should record usage', async () => {
      await engine.createSubscription('user123', 'pro');

      const record = await engine.recordUsage('user123', 'maxAIRequests', 10);

      expect(record.userId).toBe('user123');
      expect(record.resourceType).toBe('maxAIRequests');
      expect(record.quantity).toBe(10);
      expect(record.recordedAt).toBeDefined();
    });
  });

  describe('getUsage', () => {
    it('should return usage summary', async () => {
      await engine.createSubscription('user123', 'pro');
      await engine.recordUsage('user123', 'maxAIRequests', 25);
      await engine.recordUsage('user123', 'maxAIRequests', 15);
      await engine.recordUsage('user123', 'maxStorageGB', 5);

      const usage = await engine.getUsage('user123');

      expect(usage.get('maxAIRequests')).toBe(40); // 25 + 15
      expect(usage.get('maxStorageGB')).toBe(5);
    });
  });

  describe('getEntitlements', () => {
    it('should return features for active subscription', async () => {
      await engine.createSubscription('user123', 'pro');

      const entitlements = await engine.getEntitlements('user123');

      expect(entitlements.features).toContain('analytics');
      expect(entitlements.features).toContain('priority_support');
      expect(entitlements.plan).toBeDefined();
      expect(entitlements.plan!.id).toBe('pro');
    });

    it('should return free plan features when no subscription', async () => {
      const entitlements = await engine.getEntitlements('user123');

      expect(entitlements.features).toContain('basic_auth');
      expect(entitlements.plan!.id).toBe('free');
    });
  });
});
