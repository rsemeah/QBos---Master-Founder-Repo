"use strict";
/**
 * PaywallEngine™ - Pricing, Entitlements, and Billing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaywallEngine = void 0;
class PaywallEngine {
    plans = new Map();
    subscriptions = new Map();
    usage = new Map();
    constructor() {
        this.initializeDefaultPlans();
    }
    /**
     * Create or update pricing plan
     */
    async setPlan(plan) {
        this.plans.set(plan.id, plan);
        return plan;
    }
    /**
     * Get pricing plan
     */
    async getPlan(planId) {
        return this.plans.get(planId) || null;
    }
    /**
     * List all plans
     */
    async listPlans() {
        return Array.from(this.plans.values());
    }
    /**
     * Create subscription
     */
    async createSubscription(userId, planId, options) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        const now = new Date();
        const trialDays = options?.trialDays ?? plan.trialDays ?? 0;
        const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined;
        const subscription = {
            id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId,
            orgId: options?.orgId,
            planId,
            status: 'active',
            startedAt: now.toISOString(),
            trialEndsAt: trialEndsAt?.toISOString(),
        };
        const key = options?.orgId || userId;
        this.subscriptions.set(key, subscription);
        return subscription;
    }
    /**
     * Get subscription
     */
    async getSubscription(userIdOrOrgId) {
        return this.subscriptions.get(userIdOrOrgId) || null;
    }
    /**
     * Cancel subscription
     */
    async cancelSubscription(userIdOrOrgId) {
        const sub = this.subscriptions.get(userIdOrOrgId);
        if (!sub)
            return null;
        const updated = {
            ...sub,
            status: 'suspended',
            cancelledAt: new Date().toISOString(),
        };
        this.subscriptions.set(userIdOrOrgId, updated);
        return updated;
    }
    /**
     * Check if user has access to feature
     */
    async checkEntitlement(userIdOrOrgId, feature) {
        const subscription = this.subscriptions.get(userIdOrOrgId);
        if (!subscription) {
            return {
                allowed: false,
                feature,
                reason: 'No active subscription',
            };
        }
        if (subscription.status !== 'active') {
            return {
                allowed: false,
                feature,
                subscription,
                reason: `Subscription is ${subscription.status}`,
            };
        }
        const plan = this.plans.get(subscription.planId);
        if (!plan) {
            return {
                allowed: false,
                feature,
                subscription,
                reason: 'Plan not found',
            };
        }
        // Check if feature is in plan
        const hasFeature = plan.features.includes(feature);
        return {
            allowed: hasFeature,
            feature,
            subscription,
            plan,
            reason: hasFeature ? undefined : 'Feature not in plan',
        };
    }
    /**
     * Check usage limit
     */
    async checkUsageLimit(userIdOrOrgId, resourceType) {
        const subscription = this.subscriptions.get(userIdOrOrgId);
        if (!subscription) {
            return {
                allowed: false,
                feature: resourceType,
                reason: 'No active subscription',
            };
        }
        const plan = this.plans.get(subscription.planId);
        if (!plan) {
            return {
                allowed: false,
                feature: resourceType,
                reason: 'Plan not found',
            };
        }
        // Get usage for this resource
        const usageRecords = this.usage.get(`${userIdOrOrgId}:${resourceType}`) || [];
        const currentUsage = usageRecords.reduce((sum, record) => sum + record.quantity, 0);
        // Check limit
        const limit = plan.limits[resourceType];
        if (limit === undefined) {
            return {
                allowed: true,
                feature: resourceType,
                plan,
                currentUsage,
            };
        }
        return {
            allowed: currentUsage < limit,
            feature: resourceType,
            subscription,
            plan,
            currentUsage,
            limit,
            reason: currentUsage >= limit ? 'Usage limit reached' : undefined,
        };
    }
    /**
     * Record usage
     */
    async recordUsage(userIdOrOrgId, resourceType, quantity) {
        const record = {
            id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: userIdOrOrgId,
            resourceType,
            quantity,
            recordedAt: new Date().toISOString(),
        };
        const key = `${userIdOrOrgId}:${resourceType}`;
        const existing = this.usage.get(key) || [];
        this.usage.set(key, [...existing, record]);
        return record;
    }
    /**
     * Get usage summary
     */
    async getUsage(userIdOrOrgId) {
        const summary = new Map();
        for (const [key, records] of this.usage.entries()) {
            if (key.startsWith(userIdOrOrgId)) {
                const resourceType = key.split(':')[1];
                const total = records.reduce((sum, r) => sum + r.quantity, 0);
                summary.set(resourceType, total);
            }
        }
        return summary;
    }
    /**
     * Get entitlements (features list) for user/org
     */
    async getEntitlements(userId, orgId) {
        const targetId = orgId || userId;
        const subscription = this.subscriptions.get(targetId);
        if (!subscription || subscription.status !== 'active') {
            // Default to free plan features
            const freePlan = this.plans.get('free');
            return {
                features: freePlan?.features || [],
                plan: freePlan,
            };
        }
        const plan = this.plans.get(subscription.planId);
        if (!plan) {
            return { features: [] };
        }
        return {
            features: plan.features,
            plan,
        };
    }
    // Private helper methods
    initializeDefaultPlans() {
        this.plans.set('free', {
            id: 'free',
            tier: 'free',
            name: 'Free',
            price: 0,
            currency: 'USD',
            interval: 'monthly',
            features: ['basic_auth', 'ai_router'],
            limits: {
                maxUsers: 5,
                maxProjects: 1,
                maxAIRequests: 100,
                maxStorageGB: 1,
            },
        });
        this.plans.set('pro', {
            id: 'pro',
            tier: 'pro',
            name: 'Professional',
            price: 49,
            currency: 'USD',
            interval: 'monthly',
            features: ['basic_auth', 'ai_router', 'analytics', 'priority_support'],
            limits: {
                maxUsers: 50,
                maxProjects: 10,
                maxAIRequests: 10000,
                maxStorageGB: 100,
                customDomain: true,
                prioritySupport: true,
            },
            trialDays: 14,
        });
    }
}
exports.PaywallEngine = PaywallEngine;
//# sourceMappingURL=paywall.engine.js.map