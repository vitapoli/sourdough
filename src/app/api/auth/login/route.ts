import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie, validateEmail } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // 5 попыток за 15 минут с одного IP
  if (!checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Слишком много попыток. Подождите 15 минут" }, { status: 429 });
  }

  const body = await request.json();
  const email = validateEmail(body.email || "");
  if (!email) return NextResponse.json({ error: "Некорректный email" }, { status: 400 });

  // Дополнительный лимит по email — 5 попыток за 15 минут
  if (!checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Слишком много попыток. Подождите 15 минут" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });

  const valid = await verifyPassword(body.password || "", user.password);
  if (!valid) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
