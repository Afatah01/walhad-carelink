import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { migrate } from "./db/migrate";
import { userFromRequest } from "./auth";
import type { Role, UserRow } from "./db/repo";

export interface ApiCtx {
  req: NextRequest;
  user: UserRow;
}

export function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store, max-age=0",
      ...(init?.headers ?? {}),
    },
  });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>): NextResponse {
  return json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

export function ok(data: Record<string, unknown> = {}): NextResponse {
  return json({ ok: true, ...data });
}

type Handler = (ctx: ApiCtx) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a route handler with migrations, authentication, role checks and
 * consistent error shapes.
 */
export function route(
  handler: Handler,
  opts: { roles?: Role[]; public?: boolean } = {},
): (req: NextRequest, ctx?: any) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      await migrate();
      const user = await userFromRequest(req);
      if (!user && !opts.public) return fail("Please sign in to continue.", 401);
      if (user && opts.roles && !opts.roles.includes(user.role)) {
        return fail("Your role does not have access to this resource.", 403);
      }
      return await handler({ req, user: user as UserRow });
    } catch (err) {
      if (err instanceof ZodError) {
        return fail(err.issues[0]?.message ?? "Invalid request", 422, {
          issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }
      const status = (err as any)?.status ?? 500;
      if (status >= 500) console.error("[api]", req.nextUrl.pathname, err);
      return fail(status >= 500 ? "Something went wrong. Please try again." : (err as Error).message, status);
    }
  };
}

/** Very small in-memory rate limiter (per instance) for auth + public forms. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

/** Parse and clamp an integer query param. */
export function intParam(req: NextRequest, name: string, fallback: number, min = 0, max = 100000): number {
  const raw = req.nextUrl.searchParams.get(name);
  const n = raw === null ? fallback : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
