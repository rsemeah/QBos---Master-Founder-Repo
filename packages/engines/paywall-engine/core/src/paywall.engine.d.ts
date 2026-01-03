/**
 * PaywallEngine™ - Pricing, Entitlements, and Billing
 */
import type { PricingPlan, Subscription, UsageRecord, EntitlementCheck } from './types';
export declare class PaywallEngine {
    private plans;
    private subscriptions;
    private usage;
    constructor();
    /**
     * Create or update pricing plan
     */
    setPlan(plan: PricingPlan): Promise<PricingPlan>;
    /**
     * Get pricing plan
     */
    getPlan(planId: string): Promise<PricingPlan | null>;
    /**
     * List all plans
     */
    listPlans(): Promise<PricingPlan[]>;
    /**
     * Create subscription
     */
    createSubscription(userId: string, planId: string, options?: {
        orgId?: string;
        trialDays?: number;
    }): Promise<Subscription>;
    /**
     * Get subscription
     */
    getSubscription(userIdOrOrgId: string): Promise<Subscription | null>;
    /**
     * Cancel subscription
     */
    cancelSubscription(userIdOrOrgId: string): Promise<Subscription | null>;
    /**
     * Check if user has access to feature
     */
    checkEntitlement(userIdOrOrgId: string, feature: string): Promise<EntitlementCheck>;
    /**
     * Check usage limit
     */
    checkUsageLimit(userIdOrOrgId: string, resourceType: string): Promise<EntitlementCheck>;
    /**
     * Record usage
     */
    recordUsage(userIdOrOrgId: string, resourceType: string, quantity: number): Promise<UsageRecord>;
    /**
     * Get usage summary
     */
    getUsage(userIdOrOrgId: string): Promise<Map<string, number>>;
    /**
     * Get entitlements (features list) for user/org
     */
    getEntitlements(userId: string, orgId?: string): Promise<{
        features: string[];
        plan?: PricingPlan;
    }>;
    private initializeDefaultPlans;
}
//# sourceMappingURL=paywall.engine.d.ts.map