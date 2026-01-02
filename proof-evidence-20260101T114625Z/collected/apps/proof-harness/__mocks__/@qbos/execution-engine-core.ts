/**
 * Mock for @qbos/execution-engine-core package
 */

export class BuildSession {
  create = jest.fn().mockResolvedValue({
    id: 'session123',
    user_id: 'user123',
    current_state: 'IDEA_CAPTURE',
  });

  matchTemplate = jest.fn().mockResolvedValue({
    template: { id: 'auth-starter', name: 'Auth Starter' },
    confidence: 'high',
  });
}

export class EngineOrchestrator {
  constructor() {}
  start = jest.fn();
  stop = jest.fn();
}
