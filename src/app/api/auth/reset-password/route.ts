import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token, password } = await request.json();
  if (!token || !password) return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });

  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Ссылка устарела или недействительна" }, { status: 400 });
  }

  const hashed = await hashPassword(password);
  await prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } });

  // Удалить использованный токен и все сессии (принудительный перелогин)
  await prisma.passwordReset.deleteMany({ where: { userId: reset.userId } });
  await prisma.session.deleteMany({ where: { userId: reset.userId } });

  return NextResponse.json({ ok: true });
}
