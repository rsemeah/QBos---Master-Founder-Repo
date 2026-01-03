export interface EngineResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  artifacts?: Array<{ uri: string; sha256: string; contentType: string }>;
}

export interface EngineAdapter {
  name: string;
  invoke(params: any): Promise<EngineResult>;
}

export default {};
