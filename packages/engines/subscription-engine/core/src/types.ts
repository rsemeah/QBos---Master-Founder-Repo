export interface SubscriptionEngineConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface SubscriptionEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface SubscriptionEngineEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata: Record<string, any>;
}
