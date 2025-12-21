export interface AdminEngineConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface AdminEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface AdminEngineEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata: Record<string, any>;
}
