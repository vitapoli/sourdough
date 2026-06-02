import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie, validateEmail } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const email = validateEmail(body.email || "");
  if (!email) return NextResponse.json({ error: "Некорректный email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });

  const valid = await verifyPassword(body.password || "", user.password);
  if (!valid) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
