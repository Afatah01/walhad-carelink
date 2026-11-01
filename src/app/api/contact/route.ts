import { z } from "zod";
import { fail, ok, rateLimit } from "@/lib/api";
import { migrate } from "@/lib/db/migrate";
import { createContactRequest } from "@/lib/db/repo";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  topic: z.enum(["general", "subscription", "hospital", "technical", "privacy"]),
  message: z.string().trim().min(12, "Please add a little more detail").max(4000),
  consent: z.boolean().refine((v) => v === true, "Please confirm you agree to be contacted"),
});

export async function POST(req: Request) {
  await migrate();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const limited = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limited.ok) return fail("Too many messages from this device. Please try again later.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  await createContactRequest({
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company || undefined,
    topic: parsed.data.topic,
    message: parsed.data.message,
    ip,
  });

  return ok({ message: "Message received" });
}
