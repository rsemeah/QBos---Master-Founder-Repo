/**
 * ConfigEngine™ Types
 */

export type FeatureFlagStatus = 'enabled' | 'disabled' | 'conditional';

export interface FeatureFlag {
  key: string;
  status: FeatureFlagStatus;
  description?: string;
  conditions?: FlagCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface FlagCondition {
  type: 'user' | 'org' | 'percentage' | 'date';
  operator: 'equals' | 'in' | 'lt' | 'gt' | 'lte' | 'gte';
  value: string | string[] | number;
}

export interface ConfigValue {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json';
  scope: 'global' | 'user' | 'org';
  scopeId?: string;
  updatedAt: string;
}

export interface FeatureFlagEvaluation {
  key: string;
  enabled: boolean;
  reason?: string;
  matchedCondition?: FlagCondition;
}
