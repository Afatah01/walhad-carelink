import { db } from "./client";

export const nowIso = (ms: number = Date.now()) => new Date(ms).toISOString();
export const isoToMs = (v: string | null | undefined): number =>
  v ? new Date(v).getTime() : 0;

/** JSON parameter — JSONB on PostgreSQL, TEXT on SQLite. */
export function J(value: unknown): any {
  if (value === undefined || value === null) return null;
  return db().dialect === "pg" ? JSON.stringify(value) : JSON.stringify(value);
}

/** Parse a JSON column that may come back as string or object. */
export function PJ<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

export function bool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

export function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Build "?, ?, ?" placeholder groups. */
export function placeholders(n: number): string {
  return Array.from({ length: n }, () => "?").join(",");
}

export function likeEscape(s: string): string {
  return `%${s.replace(/[%_]/g, (m) => `\\${m}`)}%`;
}
