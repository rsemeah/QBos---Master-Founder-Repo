export interface CommsEngineConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface CommsEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface CommsEngineEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata: Record<string, any>;
}
