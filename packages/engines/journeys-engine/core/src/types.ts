export interface JourneysEngineConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface JourneysEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface JourneysEngineEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata: Record<string, any>;
}
