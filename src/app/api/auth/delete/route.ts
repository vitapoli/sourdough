import { prisma } from "@/lib/db";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  // Каскадное удаление: сессии, закваски (с кормлениями), рецепты
  await prisma.user.delete({ where: { id: session.user.id } });
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
