import { isValidTransition } from '../stateMachine';

describe('state machine transitions', () => {
  test('valid transition INTENT.collecting -> INTENT.refining', () => {
    expect(isValidTransition('INTENT', 'collecting', 'INTENT', 'refining')).toBe(true);
  });

  test('invalid transition EXECUTION.running -> VERDICT.ready', () => {
    expect(isValidTransition('EXECUTION', 'running', 'VERDICT', 'ready')).toBe(false);
  });
});
