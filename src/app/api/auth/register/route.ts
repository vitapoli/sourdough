import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie, validateEmail, validateName, validatePassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const email = validateEmail(body.email || "");
  if (!email) return NextResponse.json({ error: "Некорректный email" }, { status: 400 });

  const nameResult = validateName(body.name || "");
  if ("error" in nameResult) return NextResponse.json({ error: nameResult.error }, { status: 400 });
  const name = nameResult.value;

  const passwordError = validatePassword(body.password || "");
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
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
