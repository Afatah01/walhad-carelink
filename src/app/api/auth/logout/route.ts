import { cookies } from "next/headers";
import { json } from "@/lib/api";
import { SESSION_COOKIE, clearSessionCookie, signOut } from "@/lib/auth";
import { migrate } from "@/lib/db/migrate";

export const runtime = "nodejs";

export async function POST() {
  await migrate();
  const jar = await cookies();
  await signOut(jar.get(SESSION_COOKIE)?.value);
  await clearSessionCookie();
  return json({ ok: true });
}
