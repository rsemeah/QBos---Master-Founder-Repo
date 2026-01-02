/**
 * PaywallEngine™ Types
 */

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type BillingInterval = 'monthly' | 'yearly';
export type EntitlementStatus = 'active' | 'expired' | 'suspended';

export interface PricingPlan {
  id: string;
  tier: PlanTier;
  name: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  limits: PlanLimits;
  trialDays?: number;
}

export interface PlanLimits {
  maxUsers?: number;
  maxProjects?: number;
  maxAIRequests?: number;
  maxStorageGB?: number;
  customDomain?: boolean;
  prioritySupport?: boolean;
  [key: string]: number | boolean | undefined;
}

export interface Subscription {
  id: string;
  userId: string;
  orgId?: string;
  planId: string;
  status: EntitlementStatus;
  startedAt: string;
  expiresAt?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageRecord {
  id: string;
  userId: string;
  orgId?: string;
  resourceType: string;
  quantity: number;
  recordedAt: string;
}

export interface EntitlementCheck {
  allowed: boolean;
  feature: string;
  subscription?: Subscription;
  plan?: PricingPlan;
  reason?: string;
  currentUsage?: number;
  limit?: number;
}
