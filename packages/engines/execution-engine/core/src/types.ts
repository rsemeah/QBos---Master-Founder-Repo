export interface ExecutionEngineConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface ExecutionEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface ExecutionEngineEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata: Record<string, any>;
}
