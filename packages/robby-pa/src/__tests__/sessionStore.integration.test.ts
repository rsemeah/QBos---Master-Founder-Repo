import { describe, expect, test } from '@jest/globals';
import { PostgresSessionStore } from '../store/sessionStore';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

describe('PostgresSessionStore integration', () => {
  test('create, get, update session when Postgres available', async () => {
    const store = new PostgresSessionStore();

    // retry connect
    let ok = false;
    for (let i = 0; i < 10; i++) {
      try {
        await (store as any).pool.query('SELECT 1');
        ok = true; break;
      } catch (e) {
        await sleep(500);
      }
    }
    if (!ok) {
      console.warn('Postgres not available - skipping session store integration');
      return;
    }

    const s = await store.createSession({ user_id: 'u1' });
    expect(s).toHaveProperty('id');
    const fetched = await store.getSession(s.id);
    expect(fetched).not.toBeNull();

    await store.updateSession(s.id, { phase: 'EXECUTION' });
    const updated = await store.getSession(s.id);
    expect(updated).not.toBeNull();
    expect((updated as any).phase).toBe('EXECUTION');

    await (store as any).pool.end();
  }, 30000);
});
