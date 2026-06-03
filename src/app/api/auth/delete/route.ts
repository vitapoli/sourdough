import { prisma } from "@/lib/db";
import { getSession, clearSessionCookie, verifyPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  if (!body.password) {
    return NextResponse.json({ error: "Введите пароль для подтверждения" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const valid = await verifyPassword(body.password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
