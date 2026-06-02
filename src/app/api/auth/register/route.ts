import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie, validateEmail, validateName, validatePassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const email = validateEmail(body.email || "");
  if (!email) return NextResponse.json({ error: "Некорректный email" }, { status: 400 });

  const name = validateName(body.name || "");
  if (!name) return NextResponse.json({ error: "Имя от 1 до 50 символов" }, { status: 400 });

  if (!validatePassword(body.password || "")) {
    return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 409 });

  const password = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: { email, name, password },
  });

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
