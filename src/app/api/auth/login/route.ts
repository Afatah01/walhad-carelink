import { z } from "zod";
import { fail, json, rateLimit } from "@/lib/api";
import { migrate } from "@/lib/db/migrate";
import { roleHome, setSessionCookie, signIn } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(req: Request) {
  await migrate();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const limited = rateLimit(`login:${ip}`, 10, 5 * 60_000);
  if (!limited.ok) return fail("Too many attempts. Please wait a few minutes and try again.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  const result = await signIn({
    email: parsed.data.email,
    password: parsed.data.password,
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  if (!result.ok) return fail(result.message, 401);

  await setSessionCookie(result.token);
  return json({ ok: true, redirect: roleHome(result.user.role), role: result.user.role });
}

export async function GET() {
  return json({ ok: true });
}
