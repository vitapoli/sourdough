import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Введите email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Не раскрываем, существует ли email
  if (!user) return NextResponse.json({ ok: true });

  // Проверить, не отправляли ли недавно (2 минуты)
  const recent = await prisma.passwordReset.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) } },
  });
  if (recent) {
    return NextResponse.json({ error: "Письмо уже отправлено. Повторная отправка через 2 минуты" }, { status: 429 });
  }

  // Удалить старые токены этого пользователя
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  // Создать новый токен (1 час)
  const token = randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendPasswordResetEmail(user.email, token);

  return NextResponse.json({ ok: true });
}
