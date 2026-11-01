import pg from "pg";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export type Dialect = "pg" | "sqlite";
export type Row = Record<string, any>;

export interface RunResult {
  changes: number;
  lastId?: number;
}

export interface Db {
  dialect: Dialect;
  query<T = Row>(sql: string, params?: any[]): Promise<T[]>;
  get<T = Row>(sql: string, params?: any[]): Promise<T | null>;
  run(sql: string, params?: any[]): Promise<RunResult>;
  tx<T>(fn: (t: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** $1 → ? normalisation lets every repository be written once. */
function toPg(sql: string): string {
  let i = 0;
  let out = "";
  let inSingle = false;
  for (let c = 0; c < sql.length; c++) {
    const ch = sql[c];
    if (ch === "'") inSingle = !inSingle;
    if (ch === "?" && !inSingle) {
      out += `$${++i}`;
    } else {
      out += ch;
    }
  }
  return out;
}

function isInsert(sql: string) {
  return /^\s*insert\s+into/i.test(sql);
}

class PgDb implements Db {
  dialect: Dialect = "pg";
  private pool: pg.Pool;
  private client?: pg.PoolClient;

  constructor(connectionString: string, ssl: boolean) {
    this.pool = new pg.Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 8),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
    });
  }

  private get runner(): pg.Pool | pg.PoolClient {
    return this.client ?? this.pool;
  }

  async query<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
    let text = toPg(sql);
    if (isInsert(text) && !/returning/i.test(text)) text += " RETURNING *";
    const res = await this.runner.query(text, params);
    return res.rows as T[];
  }

  async get<T = Row>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    const rows = await this.query(sql, params);
    const first = rows[0] as Row | undefined;
    return { changes: rows.length || 1, lastId: first?.id ? Number(first.id) : undefined };
  }

  async tx<T>(fn: (t: Db) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const scoped = Object.create(this) as PgDb;
    scoped.client = client;
    try {
      await client.query("BEGIN");
      const result = await fn(scoped);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

interface Statement {
  reader: boolean;
  all(...params: any[]): Row[];
  get(...params: any[]): Row | undefined;
  run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
}

class SqliteDb implements Db {
  dialect: Dialect = "sqlite";
  private db: any;
  private stmtCache = new Map<string, Statement>();

  constructor(filename: string) {
    const Database = require("better-sqlite3");
    this.db = new Database(filename);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("busy_timeout = 8000");
  }

  private prep(sql: string): Statement {
    let s = this.stmtCache.get(sql);
    if (!s) {
      s = this.db.prepare(sql) as Statement;
      this.stmtCache.set(sql, s);
    }
    return s;
  }

  async query<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.prep(sql);
    const normalized = params.map((p) => (typeof p === "boolean" ? (p ? 1 : 0) : p));
    // `reader` is true only for statements that produce rows (SELECT, RETURNING).
    if (stmt.reader) return stmt.all(...normalized) as T[];
    stmt.run(...normalized);
    return [];
  }

  async get<T = Row>(sql: string, params: any[] = []): Promise<T | null> {
    const stmt = this.prep(sql);
    const normalized = params.map((p) => (typeof p === "boolean" ? (p ? 1 : 0) : p));
    if (stmt.reader) return (stmt.get(...normalized) as T) ?? null;
    const info = stmt.run(...normalized);
    return info.changes ? ({ id: Number(info.lastInsertRowid) } as T) : null;
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    const stmt = this.prep(sql);
    const normalized = params.map((p) => (typeof p === "boolean" ? (p ? 1 : 0) : p));
    if (stmt.reader) {
      const row = stmt.get(...normalized) as Row | undefined;
      return { changes: row ? 1 : 0, lastId: row?.id ? Number(row.id) : undefined };
    }
    const info = stmt.run(...normalized);
    return { changes: info.changes, lastId: Number(info.lastInsertRowid) };
  }

  async tx<T>(fn: (t: Db) => Promise<T>): Promise<T> {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const out = await fn(this);
      this.db.exec("COMMIT");
      return out;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  async close() {
    this.db.close();
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __walhadDb: Db | undefined;
}

function build(): Db {
  const url = process.env.DATABASE_URL?.trim();
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const ssl = !/localhost|127\.0\.0\.1/.test(url) && process.env.PGSSL !== "disable";
    return new PgDb(url, ssl);
  }
  const file = process.env.SQLITE_PATH ?? "/home/user/.walhad-data/walhad-carelink.db";
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return new SqliteDb(file);
}

export function db(): Db {
  if (!global.__walhadDb) global.__walhadDb = build();
  return global.__walhadDb;
}

export function dialect(): Dialect {
  return db().dialect;
}
