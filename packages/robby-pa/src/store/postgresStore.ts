import { Pool } from 'pg';
import { Receipt } from '../receipt';

export interface PostgresStoreOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export class PostgresStore {
  private pool: Pool;

  constructor(opts: PostgresStoreOptions = {}) {
    const connectionString = opts.connectionString || process.env.PG_CONNECTION_STRING;
    const config: any = connectionString ? { connectionString } : {
      host: opts.host || process.env.PGHOST || 'localhost',
      port: opts.port || Number(process.env.PGPORT) || 5433,
      user: opts.user || process.env.PGUSER || 'robby',
      password: opts.password || process.env.PGPASSWORD || 'pass',
      database: opts.database || process.env.PGDATABASE || 'robby'
    };

    this.pool = new Pool(config);
  }

  async getLastReceiptForSession(sessionId: string): Promise<Receipt | null> {
    const res = await this.pool.query(
      `SELECT * FROM robby_receipts WHERE session_id = $1 ORDER BY seq DESC LIMIT 1`,
      [sessionId]
    );
    if (!res.rows.length) return null;
    return rowToReceipt(res.rows[0]);
  }

  async insertReceipt(r: Omit<Receipt, 'hash' | 'mac'> & { hash?: string | null; mac?: string | null } & Partial<Receipt>): Promise<Receipt> {
    const q = `INSERT INTO robby_receipts(id, session_id, seq, prev_hash, type, payload, artifact_refs, hash, mac, mac_key_id, created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`;
    await this.pool.query(q, [
      (r as any).id,
      (r as any).sessionId,
      (r as any).seq,
      (r as any).prevHash,
      (r as any).type,
      (r as any).payload,
      (r as any).artifactRefs,
      (r as any).hash || null,
      (r as any).mac || null,
      (r as any).macKeyId || null,
      (r as any).createdAt || new Date().toISOString()
    ]);
    return r as Receipt;
  }

  async getReceiptsForSession(sessionId: string): Promise<Receipt[]> {
    const res = await this.pool.query(
      `SELECT * FROM robby_receipts WHERE session_id = $1 ORDER BY seq ASC`,
      [sessionId]
    );
    return res.rows.map(rowToReceipt);
  }

  async close() {
    await this.pool.end();
  }
}

function rowToReceipt(row: any): Receipt {
  return {
    id: row.id,
    sessionId: row.session_id,
    seq: Number(row.seq),
    prevHash: row.prev_hash,
    type: row.type,
    payload: row.payload,
    artifactRefs: row.artifact_refs,
    macKeyId: row.mac_key_id,
    hash: row.hash,
    mac: row.mac,
    createdAt: row.created_at
  } as Receipt;
}

export default PostgresStore;
