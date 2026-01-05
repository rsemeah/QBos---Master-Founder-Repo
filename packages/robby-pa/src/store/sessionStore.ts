import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface SessionRow {
  id: string;
  user_id?: string | null;
  org_id?: string | null;
  phase: string;
  sub_state: string;
  ux_state: string;
  intent?: any;
  plan?: any;
  verdict?: any;
  preview?: any;
  is_anonymized?: boolean;
  locked_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SessionStore {
  createSession(initial?: Partial<SessionRow>): Promise<SessionRow>;
  getSession(id: string): Promise<SessionRow | null>;
  updateSession(id: string, patch: Partial<SessionRow>): Promise<void>;
}

export class InMemorySessionStore implements SessionStore {
  private map = new Map<string, SessionRow>();

  async createSession(initial: Partial<SessionRow> = {}) {
    const id = initial.id || uuidv4();
    const now = new Date().toISOString();
    const row: SessionRow = {
      id,
      phase: initial.phase || 'INTENT',
      sub_state: initial.sub_state || 'collecting',
      ux_state: initial.ux_state || 'shaping',
      intent: initial.intent || null,
      plan: initial.plan || null,
      verdict: initial.verdict || null,
      preview: initial.preview || null,
      is_anonymized: false,
      locked_at: null,
      created_at: now,
      updated_at: now,
      user_id: initial.user_id || null,
      org_id: initial.org_id || null
    };
    this.map.set(id, row);
    return row;
  }

  async getSession(id: string) {
    return this.map.get(id) || null;
  }

  async updateSession(id: string, patch: Partial<SessionRow>) {
    const cur = this.map.get(id);
    if (!cur) throw new Error('session not found');
    const updated = { ...cur, ...patch, updated_at: new Date().toISOString() };
    this.map.set(id, updated);
  }
}

export class PostgresSessionStore implements SessionStore {
  private pool: Pool;

  constructor(poolConfig?: any) {
    const connectionString = poolConfig?.connectionString || process.env.PG_CONNECTION_STRING;
    this.pool = connectionString ? new Pool({ connectionString }) : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5433,
      user: process.env.PGUSER || 'robby',
      password: process.env.PGPASSWORD || 'pass',
      database: process.env.PGDATABASE || 'robby'
    });
  }

  async createSession(initial: Partial<SessionRow> = {}) {
    const id = initial.id || uuidv4();
    const now = new Date().toISOString();
    const q = `INSERT INTO robby_sessions(id, user_id, org_id, phase, sub_state, ux_state, intent, plan, verdict, preview, is_anonymized, locked_at, created_at, updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`;
    await this.pool.query(q, [
      id,
      initial.user_id || null,
      initial.org_id || null,
      initial.phase || 'INTENT',
      initial.sub_state || 'collecting',
      initial.ux_state || 'shaping',
      initial.intent || null,
      initial.plan || null,
      initial.verdict || null,
      initial.preview || null,
      false,
      initial.locked_at || null,
      now,
      now
    ]);
    return this.getSession(id) as Promise<SessionRow>;
  }

  async getSession(id: string) {
    const res = await this.pool.query('SELECT * FROM robby_sessions WHERE id = $1', [id]);
    if (!res.rows.length) return null;
    return res.rows[0] as SessionRow;
  }

  async updateSession(id: string, patch: Partial<SessionRow>) {
    // If changing phase without sub_state, set a sensible default sub_state for the new phase
    if (patch.phase && !('sub_state' in patch)) {
      if (patch.phase === 'INTENT') patch.sub_state = 'collecting';
      else if (patch.phase === 'EXECUTION') patch.sub_state = 'queued';
      else if (patch.phase === 'VERDICT') patch.sub_state = 'analyzing';
    }

    const keys = Object.keys(patch);
    if (!keys.length) return;

    const sets = keys.map((k, i) => `${k} = $${i + 2}`);
    const vals = keys.map(k => (patch as any)[k]);
    const q = `UPDATE robby_sessions SET ${sets.join(', ')}, updated_at = $${keys.length + 2} WHERE id = $1`;
    await this.pool.query(q, [id, ...vals, new Date().toISOString()]);
  }
}

export default {};
