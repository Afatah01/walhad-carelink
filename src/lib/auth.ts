import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  createSession,
  destroySession,
  findUserByEmail,
  getOrg,
  touchLogin,
  userFromSession,
  verifyPassword,
  type OrgRow,
  type Role,
  type UserRow,
} from "./db/repo";
import { audit } from "./db/repo";
import { migrate } from "./db/migrate";

export const SESSION_COOKIE = "walhad_session";

export interface AuthContext {
  user: UserRow;
  org: OrgRow | null;
}

export async function currentUser(): Promise<UserRow | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return userFromSession(token);
}

export async function currentAuth(): Promise<AuthContext | null> {
  const user = await currentUser();
  if (!user) return null;
  const org = user.org_id ? await getOrg(user.org_id) : null;
  return { user, org };
}

export async function requireUser(): Promise<UserRow> {
  const user = await currentUser();
  if (!user) throw new AuthError("Authentication required");
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Session refresh for API route handlers. */
export async function userFromRequest(req: NextRequest): Promise<UserRow | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const user = await userFromSession(token);
    if (user) return user;
  }
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return userFromSession(bearer.slice(7));
  }
  return null;
}

export async function signIn(input: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ ok: true; user: UserRow; token: string } | { ok: false; message: string }> {
  await migrate();
  const user = await findUserByEmail(input.email);
  if (!user) return { ok: false, message: "Email or password is incorrect." };
  const valid = await verifyPassword(user, input.password);
  if (!valid) {
    await audit({ action: "auth.failed", actorLabel: input.email, ip: input.ip ?? null, entity: "users", entityId: user.id });
    return { ok: false, message: "Email or password is incorrect." };
  }
  const token = await createSession(user.id, input.ip, input.userAgent);
  await touchLogin(user.id);
  await audit({
    action: "auth.login",
    actorId: user.id,
    actorLabel: user.email,
    entity: "users",
    entityId: user.id,
    ip: input.ip ?? null,
  });
  return { ok: true, user, token };
}

export async function signOut(token: string | undefined): Promise<void> {
  if (token) await destroySession(token);
}

export function roleHome(role: Role): string {
  if (role === "doctor" || role === "nurse" || role === "admin") return "/hospital";
  return "/dashboard";
}

export function canManageOrg(role: Role): boolean {
  return role === "admin" || role === "doctor";
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * 86_400,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
